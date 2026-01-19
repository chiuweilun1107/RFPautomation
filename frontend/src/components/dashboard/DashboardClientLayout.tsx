"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"

interface DashboardClientLayoutProps {
    children: React.ReactNode
    userEmail: string
}

export function DashboardClientLayout({ children, userEmail }: DashboardClientLayoutProps) {
    // Initialize state from localStorage if available, default to false (expanded)
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [isFullScreenPage, setIsFullScreenPage] = React.useState(false)
    const pathname = usePathname()

    React.useEffect(() => {
        // Calculate isFullScreenPage after mount to ensure server/client consistency
        // This prevents hydration mismatch since pathname is null on server but has value on client
        setIsFullScreenPage(pathname?.includes('/design') || pathname?.includes('/assessment') || false)

        // Initialize sidebar collapse state from localStorage
        const saved = localStorage.getItem("sidebar-collapsed")
        if (saved) {
            setIsCollapsed(JSON.parse(saved))
        }
    }, [pathname])


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
                            "mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500",
                            isFullScreenPage ? "max-w-full h-full" : "max-w-7xl"
                        )}
                    >
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
