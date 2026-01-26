"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sourcesApi, Source } from "@/features/sources/api/sourcesApi";
import { toast } from "sonner";
import {
  SourcesQueryData,
  SourceCreateInput,
  SourceUpdateInput
} from "@/types/query-types";

/**
 * 获取项目的源文献列表
 * 自动缓存，5分钟后过期
 */
export function useSourcesQuery(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ["sources", projectId],
    queryFn: async () => {
      const sources = await sourcesApi.getAll(projectId);
      return sources;
    },
    enabled: enabled && !!projectId,
    staleTime: 5 * 60 * 1000, // 5 分钟
    gcTime: 10 * 60 * 1000, // 10 分钟（之前的 cacheTime）
    retry: 2,
    retryDelay: (attemptIndex) => Math.pow(2, attemptIndex) * 1000,
  });
}

/**
 * 添加源文献
 * 成功后自动更新缓存
 */
export function useAddSourceMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<Source, Error, SourceCreateInput>({
    mutationFn: async (sourceData: SourceCreateInput) => {
      const response = await sourcesApi.create(sourceData);
      return response;
    },
    onSuccess: (newSource) => {
      // 更新缓存：添加新源文献到列表
      queryClient.setQueryData<SourcesQueryData>(
        ["sources", projectId],
        (oldData) => {
          return oldData ? [...oldData, newSource] : [newSource];
        }
      );
      toast.success("源文献已添加");
    },
    onError: (error: Error) => {
      toast.error(`添加失败: ${error.message}`);
    },
  });
}

/**
 * 删除源文献
 * 成功后自动更新缓存
 */
export function useDeleteSourceMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: async (sourceId: string) => {
      // TODO: Implement sources.delete() API method
      return sourceId;
    },
    onSuccess: (deletedSourceId) => {
      // 更新缓存：删除源文献
      queryClient.setQueryData<SourcesQueryData>(
        ["sources", projectId],
        (oldData) => {
          return oldData ? oldData.filter((s) => s.id !== deletedSourceId) : oldData;
        }
      );
      toast.success("源文献已删除");
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });
}

/**
 * 更新源文献
 * 成功后自动更新缓存
 */
export function useUpdateSourceMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Source,
    Error,
    { sourceId: string; data: SourceUpdateInput }
  >({
    mutationFn: async ({ sourceId, data }: { sourceId: string; data: SourceUpdateInput }) => {
      // TODO: Implement sources.update() API method
      return { id: sourceId, ...data } as Source;
    },
    onSuccess: (updatedSource) => {
      // 更新缓存：替换源文献
      queryClient.setQueryData<SourcesQueryData>(
        ["sources", projectId],
        (oldData) => {
          return oldData
            ? oldData.map((s) => (s.id === updatedSource.id ? updatedSource : s))
            : oldData;
        }
      );
      toast.success("源文献已更新");
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });
}

/**
 * 重新获取源文献列表
 */
export function useRefreshSources(projectId: string) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: ["sources", projectId],
    });
  };
}
