import { NextRequest, NextResponse } from "next/server";

// DEPRECATED: Logic moved to n8n workflow [WF04-Structure-Generation]
// Webhooks: /webhook/process-proposal-template
export async function POST(req: NextRequest) {
    return NextResponse.json({ error: "Deprecated. Use n8n webhook." }, { status: 410 });
}
/*
// ORIGINAL CODE PRESERVED FOR REFERENCE
import { createClient } from "@/lib/supabase/server";
import * as mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const projectId = formData.get("projectId") as string;
        const mode = formData.get("mode") as string || "replace"; // replace or append

        if (!file || !projectId) {
            return NextResponse.json({ error: "Missing file or projectId" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let extractedText = "";

        // 1. Extract Text
        if (file.type === "application/pdf") {
            // PDF extraction using pdf-parse (needs to be installed or use generic import if available)
            // Since we saw pdfjs-dist in package.json, we might use that, but it's often client-side.
            // Let's try to use a simpler standard PDF parser if available, or just use pdfjs-dist backend logic.
            // For now, let's assume pdf-parse is easier for backend, but it wasn't in package.json.
            // Wait, we checked package.json and saw "pdfjs-dist".
            // Using pdfjs-dist in Node environment requires some setup.
            try {
                // Dynamically import to avoid build issues if types are missing
                const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.js");

                // Set worker - for Node we generally don't utilize the worker the same way or use a verified mock 
                // but pdfjs-dist 3.x+ often needs a worker. 
                // However, for simplicity in Next.js route handlers, sometimes it's flaky.
                // Let's use a very basic text extraction if possible. 

                // Valid alternative: standard "pdf-parse" is robust for Node. 
                // But the user has pdfjs-dist. Let's try to use it.

                const data = new Uint8Array(buffer);
                const loadingTask = pdfjsLib.getDocument({ data });
                const pdfDocument = await loadingTask.promise;

                let textContent = "";
                for (let i = 1; i <= pdfDocument.numPages; i++) {
                    const page = await pdfDocument.getPage(i);
                    const tokenizedText = await page.getTextContent();
                    const pageText = tokenizedText.items.map((token: any) => token.str).join(" ");
                    textContent += pageText + "\n";
                }
                extractedText = textContent;

            } catch (e) {
                console.error("PDF Parse Error", e);
                return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
            }

        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            // DOCX
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
        } else {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }

        if (!extractedText || extractedText.length < 50) {
            return NextResponse.json({ error: "Could not extract sufficient text from file" }, { status: 400 });
        }

        // 2. AI Processing (Extract Structure)
        // Truncate text if too long (Gemini has large context but let's be safe + efficient)
        const truncatedText = extractedText.slice(0, 30000);

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            You are a professional proposal architect. 
            Analyze the following document text, which is a tender proposal or a request for proposal (RFP).
            
            Extract the "Table of Contents" or the main "Chapter Structure".
            Return ONLY a JSON array of objects with the following shape:
            {
                "title": "Chapter Title",
                "description": "Brief description of what goes here based on context (optional)"
            }
            
            Ignore minor front-matter (Cover page, etc.) unless it's a main section.
            The titles should be substantially similar to the source.
            If the text contains specific "Rating Criteria" or "Evaluation Items", prioritize those as chapters.
            
            Return raw JSON data. No markdown formatting.
            
            Document Text:
            ${truncatedText}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean markdown code blocks if present
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        let structure = [];
        try {
            structure = JSON.parse(jsonString);
        } catch (e) {
            console.error("AI JSON Parse Error", e);
            return NextResponse.json({ error: "Failed to parse structure from AI" }, { status: 500 });
        }

        // 3. Save to Database
        const supabase = await createClient();

        // Handle DB Mode
        if (mode === 'replace') {
            await supabase.from('sections').delete().eq('project_id', projectId);
        }

        // Get starting index
        let startIndex = 1;
        if (mode === 'append') {
            const { count } = await supabase.from('sections').select('*', { count: 'exact', head: true }).eq('project_id', projectId);
            startIndex = (count || 0) + 1;
        }

        const newSections = structure.map((item: any, index: number) => ({
            project_id: projectId,
            title: item.title,
            order_index: startIndex + index,
            content_draft: item.description || ""
        }));

        const { error } = await supabase.from('sections').insert(newSections);

        if (error) {
            console.error("DB Insert Error", error);
            return NextResponse.json({ error: "Failed to save sections to database" }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: newSections.length, sections: newSections });

    } catch (error) {
        console.error("Template processing error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
*/
