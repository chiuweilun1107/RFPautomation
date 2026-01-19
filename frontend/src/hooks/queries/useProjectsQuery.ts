"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { projectsApi } from "@/features/projects/api/projectsApi";
import { toast } from "sonner";

/**
 * 获取用户的项目列表（分页）
 */
export function useProjectsQuery(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["projects", { page, pageSize }],
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
  return useInfiniteQuery({
    queryKey: ["projects-infinite", { pageSize }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await projectsApi.getAll();
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (!lastPage || lastPage.length === 0) {
        return undefined;
      }
      return undefined;
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

  return useMutation({
    mutationFn: async (projectData: any) => {
      const response = await projectsApi.create(projectData);
      return response;
    },
    onSuccess: (newProject) => {
      // 更新列表缓存（第一页）
      queryClient.setQueryData(["projects", { page: 1, pageSize: 20 }], (oldData: any) => {
        if (!oldData) return { data: [newProject], nextPage: null };
        return {
          ...oldData,
          data: [newProject, ...oldData.data],
        };
      });

      // 清理无限查询缓存
      queryClient.invalidateQueries({
        queryKey: ["projects-infinite"],
      });

      toast.success("项目已创建");
    },
    onError: (error: any) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });
}

/**
 * 更新项目
 */
export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: any }) => {
      const response = await projectsApi.update(projectId, data);
      return response;
    },
    onSuccess: (updatedProject) => {
      const projectId = updatedProject.id;

      // 更新详情缓存
      queryClient.setQueryData(["project", projectId], updatedProject);

      // 更新列表缓存
      queryClient.setQueriesData(
        { queryKey: ["projects"] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((p: any) => (p.id === projectId ? updatedProject : p)),
          };
        }
      );

      // 更新无限查询缓存
      queryClient.setQueriesData(
        { queryKey: ["projects-infinite"] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.map((p: any) => (p.id === projectId ? updatedProject : p)),
            })),
          };
        }
      );

      toast.success("项目已更新");
    },
    onError: (error: any) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });
}

/**
 * 删除项目
 */
export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      await projectsApi.delete(projectId);
      return projectId;
    },
    onSuccess: (deletedProjectId) => {
      // 更新列表缓存
      queryClient.setQueriesData(
        { queryKey: ["projects"] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.filter((p: any) => p.id !== deletedProjectId),
          };
        }
      );

      // 更新无限查询缓存
      queryClient.setQueriesData(
        { queryKey: ["projects-infinite"] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data.filter((p: any) => p.id !== deletedProjectId),
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
    onError: (error: any) => {
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
