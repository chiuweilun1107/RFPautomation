"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { projectsApi } from "@/features/projects/api/projectsApi";
import { toast } from "sonner";
import {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput
} from "@/features/projects/types/project.schema";
import {
  ProjectsQueryData,
  ProjectsInfiniteQueryData,
  ProjectsInfiniteQueryPage
} from "@/types/query-types";

/**
 * 获取用户的项目列表（简化版 - 用于仪表板）
 */
export function useProjectsQuery() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await projectsApi.getAll();
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 分钟
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.pow(2, attemptIndex) * 1000,
  });
}

/**
 * 获取无限项目列表（无限滚动）
 */
export function useProjectsInfiniteQuery(pageSize = 20) {
  return useInfiniteQuery<ProjectsInfiniteQueryPage, Error, ProjectsInfiniteQueryData>({
    queryKey: ["projects-infinite", { pageSize }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await projectsApi.getAll();
      return { data: response, nextPage: null };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: ProjectsInfiniteQueryPage) => {
      if (!lastPage || lastPage.data.length === 0) {
        return undefined;
      }
      return lastPage.nextPage ?? undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * 获取单个项目详情
 */
export function useProjectQuery(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await projectsApi.getById(projectId);
      return response;
    },
    enabled: enabled && !!projectId,
    staleTime: 10 * 60 * 1000, // 10 分钟
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}

/**
 * 创建新项目
 */
export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, ProjectCreateInput>({
    mutationFn: async (projectData: ProjectCreateInput) => {
      const response = await projectsApi.create(projectData);
      return response;
    },
    onSuccess: (newProject) => {
      // 更新列表缓存（第一页）
      queryClient.setQueryData<ProjectsQueryData>(
        ["projects", { page: 1, pageSize: 20 }],
        (oldData) => {
          if (!oldData) return { data: [newProject], nextPage: null };
          return {
            ...oldData,
            data: [newProject, ...oldData.data],
          };
        }
      );

      // 清理无限查询缓存
      queryClient.invalidateQueries({
        queryKey: ["projects-infinite"],
      });

      toast.success("项目已创建");
    },
    onError: (error: Error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });
}

/**
 * 更新项目
 */
export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    Project,
    Error,
    { projectId: string; data: ProjectUpdateInput }
  >({
    mutationFn: async ({ projectId, data }: { projectId: string; data: ProjectUpdateInput }) => {
      const response = await projectsApi.update(projectId, data);
      return response;
    },
    onSuccess: (updatedProject) => {
      const projectId = updatedProject.id;

      // 更新详情缓存
      queryClient.setQueryData<Project>(["project", projectId], updatedProject);

      // 更新列表缓存
      queryClient.setQueriesData<ProjectsQueryData>(
        { queryKey: ["projects"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((p) => (p.id === projectId ? updatedProject : p)),
          };
        }
      );

      // 更新无限查询缓存
      queryClient.setQueriesData<ProjectsInfiniteQueryData>(
        { queryKey: ["projects-infinite"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.map((p) => (p.id === projectId ? updatedProject : p)),
            })),
          };
        }
      );

      toast.success("项目已更新");
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });
}

/**
 * 删除项目
 */
export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: async (projectId: string) => {
      await projectsApi.delete(projectId);
      return projectId;
    },
    onSuccess: (deletedProjectId) => {
      // 更新列表缓存
      queryClient.setQueriesData<ProjectsQueryData>(
        { queryKey: ["projects"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.filter((p) => p.id !== deletedProjectId),
          };
        }
      );

      // 更新无限查询缓存
      queryClient.setQueriesData<ProjectsInfiniteQueryData>(
        { queryKey: ["projects-infinite"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              data: page.data.filter((p) => p.id !== deletedProjectId),
            })),
          };
        }
      );

      // 清理详情缓存
      queryClient.removeQueries({
        queryKey: ["project", deletedProjectId],
      });

      toast.success("项目已删除");
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });
}

/**
 * 重新获取项目列表
 */
export function useRefreshProjects() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: ["projects"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["projects-infinite"],
    });
  };
}
