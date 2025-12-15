import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
    return (
        <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
            <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
                Automate Your RFP Responses <br className="hidden sm:inline" />
                with Intelligent AI.
            </h1>
            <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl text-gray-500">
                Transform tedious government tenders and security questionnaires into
                streamlined workflows. Support for DOCX, Excel, and PDF.
            </p>
            <div className="flex w-full items-center justify-center space-x-4 py-4 md:pb-10">
                <Link href="/login">
                    <Button className="h-11 px-8 text-base">Get Started</Button>
                </Link>
                <Link href="/docs" target="_blank">
                    <Button variant="outline" className="h-11 px-8 text-base">
                        How it works
                    </Button>
                </Link>
            </div>
        </section>
    );
}
