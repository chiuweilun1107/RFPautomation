"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { templatesApi } from "@/features/templates/api/templatesApi";
import { toast } from "sonner";

/**
 * 获取项目的模板列表
 * 自动缓存，5分钟后过期
 */
export function useTemplatesQuery(projectId: string, enabled = true) {
  return useQuery({
    queryKey: ["templates", projectId],
    queryFn: async () => {
      const templates = await templatesApi.getAll(projectId);
      return templates;
    },
    enabled: enabled && !!projectId,
    staleTime: 5 * 60 * 1000, // 5 分钟
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.pow(2, attemptIndex) * 1000,
  });
}

/**
 * 获取单个模板详情
 */
export function useTemplateQuery(templateId: string, enabled = true) {
  return useQuery({
    queryKey: ["template", templateId],
    queryFn: async () => {
      const template = await templatesApi.getById(templateId);
      return template;
    },
    enabled: enabled && !!templateId,
    staleTime: 10 * 60 * 1000, // 10 分钟
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}

/**
 * 创建模板
 */
export function useCreateTemplateMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData: any) => {
      // TODO: Implement templates.create() API method
      return { id: 'new', ...templateData };
    },
    onSuccess: (newTemplate) => {
      // 更新列表缓存
      queryClient.setQueryData(["templates", projectId], (oldData: any[] | undefined) => {
        return oldData ? [...oldData, newTemplate] : [newTemplate];
      });
      toast.success("模板已创建");
    },
    onError: (error: any) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });
}

/**
 * 更新模板
 */
export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, data }: { templateId: string; data: any }) => {
      // TODO: Implement templates.update() API method
      return { id: templateId, ...data };
    },
    onSuccess: (updatedTemplate) => {
      // 更新详情缓存
      queryClient.setQueryData(["template", updatedTemplate.id], updatedTemplate);

      // 更新列表缓存
      queryClient.setQueryData(
        ["templates", updatedTemplate.project_id],
        (oldData: any[] | undefined) => {
          return oldData
            ? oldData.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
            : oldData;
        }
      );

      toast.success("模板已更新");
    },
    onError: (error: any) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });
}

/**
 * 删除模板
 */
export function useDeleteTemplateMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      // TODO: Implement templates.delete() API method
      return templateId;
    },
    onSuccess: (deletedTemplateId) => {
      // 更新列表缓存
      queryClient.setQueryData(["templates", projectId], (oldData: any[] | undefined) => {
        return oldData ? oldData.filter((t) => t.id !== deletedTemplateId) : oldData;
      });

      // 清理详情缓存
      queryClient.removeQueries({
        queryKey: ["template", deletedTemplateId],
      });

      toast.success("模板已删除");
    },
    onError: (error: any) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });
}

/**
 * 重新获取模板列表
 */
export function useRefreshTemplates(projectId: string) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: ["templates", projectId],
    });
  };
}
