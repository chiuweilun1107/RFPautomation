"use client"

import * as React from "react"
import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"

interface DashboardClientLayoutProps {
    children: React.ReactNode
    userEmail: string
}

export function DashboardClientLayout({ children, userEmail }: DashboardClientLayoutProps) {
    const pathname = usePathname()

    // Initialize isFullScreenPage state (default false to match server)
    const [isFullScreenPage, setIsFullScreenPage] = React.useState(false)

    // Update isFullScreenPage on client side based on pathname
    // All workspace pages under /dashboard/[id]/* should be fullscreen
    React.useEffect(() => {
        if (pathname) {
            const isWorkspacePage = /^\/dashboard\/[^/]+\/(assessment|launch|planning|writing|review|handover|design)/.test(pathname)
            setIsFullScreenPage(isWorkspacePage)
        }
    }, [pathname])

    // Initialize sidebar collapse state (this only affects client-side rendering after hydration)
    const [isCollapsed, setIsCollapsed] = React.useState(false)

    React.useEffect(() => {
        // Initialize sidebar collapse state from localStorage after mount
        const saved = localStorage.getItem("sidebar-collapsed")
        if (saved) {
            setIsCollapsed(JSON.parse(saved))
        }
    }, [])


    const toggleSidebar = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem("sidebar-collapsed", JSON.stringify(newState))
    }

    return (
        <div className="flex h-screen w-full bg-background font-mono antialiased text-foreground overflow-hidden relative">
            <DashboardSidebar
                userEmail={userEmail}
                className="hidden lg:flex"
                isCollapsed={isCollapsed}
                onToggle={toggleSidebar}
            />

            <div
                className={cn(
                    "flex flex-col flex-1 h-full overflow-hidden relative z-10 transition-all duration-300 ease-in-out",
                    isCollapsed ? "lg:pl-20" : "lg:pl-72"
                )}
            >
                {/* Content Area */}
                <main
                    className={cn(
                        "flex-1",
                        isFullScreenPage
                            ? "p-0 overflow-hidden no-scrollbar"
                            : "p-4 md:p-8 pt-16 lg:pt-8 overflow-y-auto custom-scrollbar"
                    )}
                >
                    <div
                        className={cn(
                            "mx-auto",
                            isFullScreenPage ? "max-w-full h-full" : "max-w-7xl"
                        )}
                    >
                        <Suspense fallback={null}>
                            {children}
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    )
}
