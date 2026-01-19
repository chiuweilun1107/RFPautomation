'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Terminal, ArrowRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const CAROUSEL_ITEMS = [
    {
        id: 1,
        title: "STEP 01: INGESTION",
        desc: "Securely input complex tender documentation.",
        image: "/carousel-1-tender-retro.png",
        meta: "RAW_INPUT"
    },
    {
        id: 2,
        title: "STEP 02: ANALYSIS",
        desc: "AI identifies key criteria and compliance requirements.",
        image: "/carousel-2-analysis-retro.png",
        meta: "DECONSTRUCTION"
    },
    {
        id: 3,
        title: "STEP 03: DRAFTING",
        desc: "Generate professional responses based on proven assets.",
        image: "/carousel-3-drafting-retro.png",
        meta: "GENERATION"
    },
    {
        id: 4,
        title: "STEP 04: WINNING PITCH",
        desc: "Present data-backed, winning proposals with confidence.",
        image: "/carousel-4-success-retro.png",
        meta: "PRESENTATION"
    }
];

export function Hero() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
            }, 4000); // 4 seconds per slide
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    return (
        <section className="border-b border-black dark:border-white bg-background pt-16 pb-24 md:pt-32 md:pb-32">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid lg:grid-cols-12 gap-16 items-center">

                    {/* Left: Typography & Copy (Grid cols 5) */}
                    <div className="lg:col-span-5 flex flex-col items-start text-left">
                        <div className="inline-flex items-center border border-black dark:border-white px-3 py-1 text-xs font-mono font-medium text-foreground mb-8">
                            <Terminal className="mr-2 h-3 w-3" />
                            SYSTEM_STATUS: ONLINE
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground leading-[0.9] mb-8">
                            RFP<br />
                            Automation<span className="text-muted-foreground">.</span>
                        </h1>

                        <p className="text-xl text-muted-foreground leading-relaxed font-light mb-10">
                            The industrial-grade engine for government tenders.
                            <span className="text-foreground font-medium block mt-2">Precision engineering for your proposals.</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-0 w-full mb-12 border border-black dark:border-white">
                            <Link href="/login" className="flex-1">
                                <Button size="lg" className="w-full h-14 px-8 rounded-none bg-foreground text-background hover:bg-muted-foreground hover:text-white transition-colors text-base font-mono">
                                    [ START_PROJECT ]
                                </Button>
                            </Link>
                            <div className="w-[1px] bg-black dark:bg-white hidden sm:block"></div>
                            <Link href="/docs" target="_blank" className="flex-1">
                                <Button variant="ghost" size="lg" className="w-full h-14 px-8 rounded-none text-foreground hover:bg-secondary transition-colors text-base font-mono">
                                    READ_DOCS
                                </Button>
                            </Link>
                        </div>

                        {/* Carousel Controls (Mini) */}
                        <div className="flex items-center gap-4 text-xs font-mono">
                            <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-foreground text-muted-foreground">
                                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </button>
                            <div className="flex gap-1">
                                {CAROUSEL_ITEMS.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "h-1 w-8 transition-colors duration-300",
                                            currentSlide === idx ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-gray-800"
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-muted-foreground">0{currentSlide + 1} / 0{CAROUSEL_ITEMS.length}</span>
                        </div>
                    </div>

                    {/* Right: Carousel Visualization (Grid cols 7) */}
                    <div className="lg:col-span-7 relative">
                        <div className="relative aspect-[16/10] w-full border border-black dark:border-white p-2">
                            <div className="relative h-full w-full overflow-hidden bg-background-secondary">
                                {/* Slides */}
                                {CAROUSEL_ITEMS.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "absolute inset-0 transition-opacity duration-700 ease-in-out",
                                            currentSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0"
                                        )}
                                    >
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover grayscale" // Always grayscale for Swiss look
                                            priority={idx === 0}
                                        />

                                        {/* Slide Caption Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t border-black dark:border-white p-4 flex justify-between items-end">
                                            <div>
                                                <div className="text-xs font-mono font-bold text-foreground mb-1">{item.title}</div>
                                                <div className="text-sm text-muted-foreground">{item.desc}</div>
                                            </div>
                                            <div className="text-xs font-mono text-muted-foreground hidden sm:block">
                                                ID: {item.meta}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Decorative technical marks */}
                            <div className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-black dark:border-white z-20"></div>
                            <div className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-black dark:border-white z-20"></div>
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l border-b border-black dark:border-white z-20"></div>
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r border-b border-black dark:border-white z-20"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
