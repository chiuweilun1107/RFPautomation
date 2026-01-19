/**
 * Google Drive File Import API
 * Downloads files from Google Drive and creates sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@/app/api/auth/google/refresh/route';

interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { fileId, projectId, folderId } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Get valid access token (refreshes if needed)
    const accessToken = await getValidAccessToken(user.id);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to get access token. Please reconnect Google Drive.' },
        { status: 401 }
      );
    }

    // Get file metadata from Google Drive
    const metadataResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!metadataResponse.ok) {
      console.error('Failed to get file metadata:', await metadataResponse.text());
      return NextResponse.json(
        { error: 'Failed to get file metadata from Google Drive' },
        { status: 500 }
      );
    }

    const metadata: DriveFileMetadata = await metadataResponse.json();

    // Determine file type from MIME type
    const mimeTypeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'text/plain': 'txt',
      'text/markdown': 'markdown',
      'application/vnd.google-apps.document': 'docx', // Export as DOCX
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-excel': 'xls',
    };

    const fileType = mimeTypeMap[metadata.mimeType] || 'unknown';

    // Download file from Google Drive
    let downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    // Google Docs need to be exported
    if (metadata.mimeType === 'application/vnd.google-apps.document') {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document`;
    }

    const fileResponse = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!fileResponse.ok) {
      console.error('Failed to download file:', await fileResponse.text());
      return NextResponse.json(
        { error: 'Failed to download file from Google Drive' },
        { status: 500 }
      );
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const fileBlob = new Blob([fileBuffer]);

    // Generate unique filename (safe for Supabase Storage)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);

    // Extract file extension from original filename
    const fileExtension = metadata.name.split('.').pop() || 'file';

    // Create safe filename (only alphanumeric, hyphen, underscore)
    const safeFileName = `${randomStr}_${timestamp}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('raw-files')
      .upload(safeFileName, fileBlob, {
        contentType: metadata.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload to storage:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Create source record
    const sourceData = {
      title: metadata.name,
      origin_url: uploadData.path,
      type: fileType,
      status: 'processing',
      source_type: 'google_drive',
      project_id: projectId || null,
      folder_id: folderId || null,
      metadata: {
        google_drive_id: fileId,
        mime_type: metadata.mimeType,
        size: metadata.size,
        imported_at: new Date().toISOString(),
      },
    };

    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert(sourceData)
      .select()
      .single();

    if (sourceError) {
      console.error('Failed to create source:', sourceError);
      return NextResponse.json(
        { error: 'Failed to create source record' },
        { status: 500 }
      );
    }

    // Create project_sources relation if projectId provided
    if (projectId) {
      await supabase.from('project_sources').insert({
        project_id: projectId,
        source_id: source.id,
      });
    }

    // Trigger n8n ingest workflow
    try {
      const n8nWebhook = process.env.N8N_INGEST_WEBHOOK;
      if (n8nWebhook) {
        await fetch(n8nWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_id: source.id,
            file_path: uploadData.path,
            bucket: 'raw-files',
            type: fileType,
          }),
        });
      }
    } catch (error) {
      console.error('Failed to trigger n8n workflow:', error);
      // Don't fail the request if n8n trigger fails
    }

    return NextResponse.json({
      success: true,
      source,
    });
  } catch (error) {
    console.error('Google Drive import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
