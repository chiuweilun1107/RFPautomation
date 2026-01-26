"use client"

import dynamic from "next/dynamic"
import { ContentSkeleton } from "@/components/ui/skeletons/ContentSkeleton"
import type { Template } from "@/types"

const TemplateDesigner = dynamic(
  () => import("./TemplateDesigner").then((mod) => ({ default: mod.TemplateDesigner })),
  {
    loading: () => (
      <div className="h-full w-full p-8">
        <ContentSkeleton />
      </div>
    ),
    ssr: false
  }
)

interface TemplateDesignerWrapperProps {
  template: Template
}

export function TemplateDesignerWrapper({ template }: TemplateDesignerWrapperProps) {
  return <TemplateDesigner template={template} />
}
