/**
 * 事件处理程序工具类
 * 统一处理所有用户交互事件
 */

import { Section, Task } from "../types";
import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";

export class EventHandlers {
    /**
     * 处理节点展开/折叠
     */
    static handleToggleExpand(
        id: string,
        expandedSet: Set<string>,
        setExpandedSet: (set: Set<string>) => void
    ) {
        const newSet = new Set(expandedSet);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedSet(newSet);
    }

    /**
     * 处理章节删除
     */
    static async handleDeleteSection(
        sectionId: string,
        sections: Section[],
        setSections: (sections: Section[]) => void,
        supabase: SupabaseClient
    ) {
        try {
            const { error } = await supabase
                .from("sections")
                .delete()
                .eq("id", sectionId);

            if (error) throw error;

            const newSections = sections.filter((s) => s.id !== sectionId);
            setSections(newSections);
            toast.success("Chapter deleted");
        } catch (error) {
            toast.error(`Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * 处理任务删除
     */
    static async handleDeleteTask(
        taskId: string,
        sectionId: string,
        sections: Section[],
        setSections: (sections: Section[]) => void,
        supabase: SupabaseClient
    ) {
        try {
            const { error } = await supabase
                .from("tasks")
                .delete()
                .eq("id", taskId);

            if (error) throw error;

            const newSections = sections.map((s) => {
                if (s.id === sectionId) {
                    return {
                        ...s,
                        tasks: s.tasks?.filter((t) => t.id !== taskId) || [],
                    };
                }
                return s;
            });
            setSections(newSections);
            toast.success("Task deleted");
        } catch (error) {
            toast.error(`Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * 处理图片删除
     */
    static async handleDeleteImage(
        imageId: string,
        imageUrl: string,
        supabase: SupabaseClient,
        onSuccess?: () => void
    ) {
        try {
            const { error: deleteError } = await supabase
                .from("task_images")
                .delete()
                .eq("id", imageId);

            if (deleteError) throw deleteError;

            // 尝试从存储中删除文件
            try {
                const filePath = imageUrl.split("/").pop();
                if (filePath) {
                    await supabase.storage
                        .from("proposal-images")
                        .remove([filePath]);
                }
            } catch {
                // 存储删除失败是可以接受的
            }

            toast.success("Image deleted");
            onSuccess?.();
        } catch (error) {
            toast.error(`Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * 处理内联编辑保存
     */
    static async handleSaveInlineEdit(
        type: "section" | "task",
        id: string,
        newValue: string,
        supabase: SupabaseClient,
        onSuccess?: () => void
    ) {
        if (!newValue.trim()) {
            toast.error("Content cannot be empty");
            return;
        }

        try {
            const table = type === "section" ? "sections" : "tasks";
            const field = type === "section" ? "title" : "requirement_text";

            const { error } = await supabase
                .from(table)
                .update({ [field]: newValue })
                .eq("id", id);

            if (error) throw error;

            toast.success(`${type === "section" ? "Chapter" : "Task"} updated`);
            onSuccess?.();
        } catch (error) {
            toast.error(`Update failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * 处理拖拽排序
     */
    static async handleReorder(
        type: "section" | "task",
        items: (Section | Task)[],
        supabase: SupabaseClient,
        onSuccess?: () => void
    ) {
        try {
            const table = type === "section" ? "sections" : "tasks";
            const updates = items.map((item, index) => ({
                id: item.id,
                order_index: index,
            }));

            for (const update of updates) {
                const { error } = await supabase
                    .from(table)
                    .update({ order_index: update.order_index })
                    .eq("id", update.id);

                if (error) throw error;
            }

            toast.success("Reordered successfully");
            onSuccess?.();
        } catch (error) {
            toast.error(`Reorder failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}
