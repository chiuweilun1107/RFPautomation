"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

interface UserNavProps {
    user: any // Typed as any to avoid tight coupling with specific Supabase types here, but conceptually User
}

export function UserNav({ user }: UserNavProps) {
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    // Get initials for avatar fallback
    const email = user.email || ""
    const initials = email.substring(0, 2).toUpperCase()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-white">
                    <Avatar className="h-8 w-8 border border-black dark:border-white">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={email} />
                        <AvatarFallback className="bg-background text-foreground font-mono font-bold text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-none border-black dark:border-white" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none font-mono">[ USER ]</p>
                        <p className="text-xs leading-none text-muted-foreground truncate font-mono">
                            {email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-muted" />
                <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer font-mono text-xs focus:bg-muted" asChild>
                        <Link href="/dashboard">
                            [ DASHBOARD ]
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer font-mono text-xs focus:bg-muted" asChild>
                        <Link href="/settings">
                            [ SETTINGS ]
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-muted" />
                <DropdownMenuItem
                    className="cursor-pointer font-mono text-xs focus:bg-muted text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                    onClick={handleSignOut}
                >
                    [ LOGOUT ]
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
