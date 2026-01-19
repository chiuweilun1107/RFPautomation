import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ProjectAssessment {
  id: string;
  project_id: string;
  criterion: string;
  score: number;
  notes?: string;
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

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          project_assessments(*)
        `)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProjects(data || []);
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
          fetchProjects();
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
