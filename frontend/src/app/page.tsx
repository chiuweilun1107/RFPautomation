import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black font-sans">
      <header className="container mx-auto sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800">
        <div className="flex h-16 items-center justify-between py-4">
          <div className="flex gap-2 items-center">
            <span className="text-xl font-bold tracking-tight">RFP Automation</span>
          </div>
          <nav>
            <AuthButtons />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
      <footer className="border-t border-gray-100 dark:border-zinc-800 py-6 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
            Built by <span className="font-medium underline underline-offset-4">RFP Team</span>.
            The source code is available on <span className="font-medium underline underline-offset-4">GitHub</span>.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";

async function AuthButtons() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    user ? (
      <Link
        href="/dashboard"
        className="text-sm font-medium transition-colors hover:text-black dark:hover:text-white text-gray-500"
      >
        Dashboard
      </Link>
    ) : (
      <Link href="/login">
        <Button variant="default" size="lg" className="!text-base h-12 px-6">
          登入
        </Button>
      </Link>
    )
  )
}
