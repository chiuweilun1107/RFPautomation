import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import ChatInterface from "@/components/chat/ChatInterface"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-black font-sans">
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-gray-100 dark:border-zinc-800">
                <div className="container mx-auto flex h-14 items-center justify-between">
                    <div className="mr-4 flex">
                        <Link className="mr-6 flex items-center space-x-2" href="/dashboard">
                            <span className="hidden font-bold sm:inline-block">RFP Automation</span>
                        </Link>
                        <nav className="flex items-center space-x-6 text-sm font-medium">
                            <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground">Projects</Link>
                            <Link href="/dashboard/knowledge" className="transition-colors hover:text-foreground/80 text-foreground/60">Knowledge Base</Link>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground mr-2 hidden md:inline-block text-gray-500">{user.email}</span>
                        <form action="/api/auth/signout" method="post">
                            <Button variant="outline" size="sm">Sign Out</Button>
                        </form>
                    </div>
                </div>
            </header>
            <main className="flex-1 space-y-4 p-8 pt-6">
                {children}
            </main>
            <ChatInterface />
        </div>
    )
}
