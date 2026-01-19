"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Settings, BookOpen, LogOut, Menu, User, GanttChart, FileStack, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

interface DashboardSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    userEmail: string
    isCollapsed?: boolean
    onToggle?: () => void
}

export function DashboardSidebar({ className, userEmail, isCollapsed, onToggle }: DashboardSidebarProps) {
    const pathname = usePathname()
    const [open, setOpen] = React.useState(false)

    // Handle controlled vs uncontrolled state for collapse
    // If props are provided, use them; otherwise default to false (expanded)
    // Note: The parent DashboardClientLayout will usually control this.
    const collapsed = isCollapsed ?? false

    const routes = [
        {
            label: "PROJECTS",
            icon: FileText,
            href: "/dashboard",
            active: pathname === "/dashboard" || pathname.startsWith("/dashboard/projects"),
        },
        {
            label: "KNOWLEDGE_BASE",
            icon: BookOpen,
            href: "/dashboard/knowledge",
            active: pathname.startsWith("/dashboard/knowledge"),
        },
        {
            label: "TEMPLATES",
            icon: FileStack,
            href: "/dashboard/templates",
            active: pathname.startsWith("/dashboard/templates"),
        },
        {
            label: "TENDER_LOGS",
            icon: GanttChart,
            href: "/dashboard/tenders",
            active: pathname.startsWith("/dashboard/tenders"),
        },
        {
            label: "SETTINGS",
            icon: Settings,
            href: "/dashboard/settings",
            active: pathname.startsWith("/dashboard/settings"),
        },
    ]

    const SidebarContent = () => (
        <div className="flex h-full flex-col py-6 bg-background text-foreground relative group border-r border-black dark:border-white">
            {/* Toggle Button - Only visible on desktop when hovered or collapsed */}
            {onToggle && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className={cn(
                        "absolute -right-3 top-9 z-50 h-6 w-6 rounded-none border border-black dark:border-white bg-background hover:bg-black hover:text-white hidden lg:flex items-center justify-center transition-opacity duration-200",
                        collapsed ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                >
                    {collapsed ? (
                        <ChevronRight className="h-3 w-3" />
                    ) : (
                        <ChevronLeft className="h-3 w-3" />
                    )}
                </Button>
            )}

            {/* Logo Section */}
            <Link
                href="/"
                className={cn(
                    "flex items-center gap-3 transition-all duration-300 mb-8",
                    collapsed ? "px-2 justify-center" : "px-6"
                )}
            >
                <div className="relative shrink-0">
                    <span className="font-mono font-bold text-xl tracking-tighter">[R]</span>
                </div>
                {!collapsed && (
                    <div className="flex flex-col animate-in fade-in duration-300">
                        <span className="font-mono font-bold text-lg tracking-tighter leading-none">[ RFP_AUTO ]</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">DASHBOARD_V1</span>
                    </div>
                )}
            </Link>

            <div className="px-6 mb-6">
                <Separator className="bg-black dark:bg-white" />
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-4">
                <div className="flex flex-col gap-2">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setOpen(false)}
                            title={collapsed ? route.label : undefined}
                        >
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full h-10 text-xs font-mono font-medium transition-none rounded-none border border-transparent",
                                    collapsed ? "justify-center px-2" : "justify-start gap-4 px-4",
                                    route.active
                                        ? "bg-foreground text-background border-black dark:border-white"
                                        : "hover:bg-muted hover:border-black dark:hover:border-white hover:text-foreground"
                                )}
                            >
                                <route.icon className={cn("h-4 w-4 shrink-0", route.active && "text-background")} />
                                {!collapsed && <span className="animate-in fade-in duration-300 uppercase tracking-wider">{route.label}</span>}
                            </Button>
                        </Link>
                    ))}
                </div>
            </ScrollArea>

            {/* User Footer */}
            <div className={cn("mt-auto pt-4 border-t border-black dark:border-white", collapsed ? "px-2" : "px-6")}>
                <div className={cn(
                    "transition-all duration-300",
                    collapsed ? "p-2 flex flex-col items-center justify-center gap-2" : "py-4"
                )}>
                    <div className={cn("flex items-center gap-3", !collapsed && "mb-4")}>
                        <div className="h-8 w-8 border border-black dark:border-white flex items-center justify-center bg-muted">
                            <User className="h-4 w-4" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col overflow-hidden animate-in fade-in duration-300">
                                <span className="text-xs font-mono font-bold truncate">ADMINISTRATOR</span>
                                <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]" title={userEmail}>
                                    {userEmail}
                                </span>
                            </div>
                        )}
                    </div>

                    <form action="/api/auth/signout" method="post" className="w-full">
                        <Button
                            variant="outline"
                            size={collapsed ? "icon" : "sm"}
                            className={cn(
                                "w-full rounded-none border-black dark:border-white hover:bg-black hover:text-white transition-colors font-mono text-xs uppercase",
                                collapsed
                                    ? "h-8 w-8"
                                    : "justify-start gap-2 h-9"
                            )}>
                            <LogOut className={cn("h-3.5 w-3.5", collapsed && "h-4 w-4")} />
                            {!collapsed && "LOGOUT"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden lg:flex flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out bg-background",
                    collapsed ? "w-20" : "w-72",
                    className
                )}
            >
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={open} onOpenChange={setOpen}>
                <div className="lg:hidden absolute left-4 top-4 z-50">
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-none border-black dark:border-white bg-background">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                </div>
                <SheetContent side="left" className="p-0 w-72 border-r border-black dark:border-white bg-background">
                    <SidebarContent />
                </SheetContent>
            </Sheet>
        </>
    )
}
