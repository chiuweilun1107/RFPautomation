import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ProjectAssessment {
  id: string;
  project_id: string;
  basic_info?: any;
  dates?: any;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  title: string;
  status: 'processing' | 'active' | 'completed' | 'archived';
  updated_at: string;
  created_at: string;
  owner_id: string;
  agency?: string;
  deadline?: string;
  project_assessments?: ProjectAssessment[];
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const fetchProjects = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // 使用我們的加速 API
      const response = await fetch(`/api/projects/accelerated${forceRefresh ? '?refresh=true' : ''}`);
      const { data, error: fetchError } = await response.json();

      if (fetchError) throw new Error(fetchError);

      // Map assessment data to project fields if missing
      const mappedData = (data as any[])?.map(p => {
        const assessment = Array.isArray(p.project_assessments)
          ? p.project_assessments[0]
          : p.project_assessments;

        const assessedAgency = assessment?.basic_info?.content?.['主辦機關']?.text;
        const assessedDeadline = assessment?.dates?.content?.['投標截止']?.text;

        return {
          ...p,
          agency: p.agency || assessedAgency,
          deadline: p.deadline || assessedDeadline
        };
      });

      setProjects(mappedData || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;

      // Update local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting project:', err);
      return { success: false, error: err };
    }
  };

  useEffect(() => {
    fetchProjects();

    // Setup realtime subscription
    const channel = supabase
      .channel('projects_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => {
          fetchProjects(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    deleteProject,
  };
}
