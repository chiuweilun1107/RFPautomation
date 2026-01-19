import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-black selection:text-white">
      {/* Swiss Header: Bordered, Functional, English */}
      <header className="sticky top-0 z-50 w-full border-b border-black dark:border-white bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-mono font-bold text-lg tracking-tighter">
            [ RFP_AUTO ]
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium font-mono">
            <Link href="/solutions" className="hover:underline underline-offset-4 decoration-1">SOLUTIONS</Link>
            <Link href="/pricing" className="hover:underline underline-offset-4 decoration-1">PRICING</Link>
            <Link href="/docs" className="hover:underline underline-offset-4 decoration-1">DOCUMENTATION</Link>
          </nav>

          <div className="flex items-center gap-4">
            <AuthButtons />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Hero />
        {/* TrustBar Removed as per request */}
        <Features />
      </main>

      {/* Swiss Footer: grid-cols-4, English, High Contrast */}
      <footer className="border-t border-black dark:border-white bg-background-secondary py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            <div className="space-y-4">
              <div className="font-bold text-lg tracking-tighter">[ RFP_AUTO ]</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The industrial standard for government tender automation.
                Reliability, Traceability, Security.
              </p>
            </div>

            <div>
              <h4 className="font-mono text-xs font-bold uppercase mb-6">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Changelog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Security</Link></li>
                <li><Link href="#" className="hover:text-foreground">Roadmap</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs font-bold uppercase mb-6">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground">Legal</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs font-bold uppercase mb-6">Connect</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">GitHub</Link></li>
                <li><Link href="#" className="hover:text-foreground">Twitter</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 border-t border-black/10 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground font-mono">
            <p>© 2024 RFP Automation Inc. All rights reserved.</p>
            <div className="flex gap-4">
              <span>SYSTEM STATUS: NORMAL</span>
              <span>REGION: ASIA-EAST</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

async function AuthButtons() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex items-center gap-4">
      {/* Show Dashboard link if logged in, but KEEP the auth buttons visible for design verification */}
      {user && (
        <Link
          href="/dashboard"
          className="text-sm font-medium hover:underline underline-offset-4 decoration-1 font-mono hidden md:block"
        >
          [ DASHBOARD ]
        </Link>
      )}

      {/* Always show these buttons for now so the user can see them */}
      <div className="flex items-center gap-4">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="rounded-none h-9 px-4 font-mono text-xs hover:bg-muted text-muted-foreground hover:text-foreground">
            [ LOGIN ]
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm" className="rounded-none h-9 px-4 font-mono text-xs bg-foreground text-background hover:bg-muted-foreground hover:text-white">
            [ REGISTER ]
          </Button>
        </Link>
      </div>
    </div>
  )
}
