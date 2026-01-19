"use client"

import dynamic from 'next/dynamic'

const CreateProjectDialog = dynamic(
    () => import('./CreateProjectDialog').then(mod => mod.CreateProjectDialog),
    { ssr: false }
)

export function CreateProjectDialogWrapper() {
    return <CreateProjectDialog />
}
