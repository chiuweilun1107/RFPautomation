import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

export function Features() {
    const features = [
        {
            id: "01",
            title: "Ingestion Engine",
            desc: "Native support for government PDF/DOCX specs. Automated table extraction.",
            meta: "PARSER_V3",
            image: "/feature-01-ingestion.png"
        },
        {
            id: "02",
            title: "Hybrid Knowledge",
            desc: "Tri-source data fusion: Tender Specs + Internal Assets + External Regulatory Data.",
            meta: "VECTOR_DB",
            image: "/feature-02-knowledge.png"
        },
        {
            id: "03",
            title: "Traceability",
            desc: "Crypto-graphic citation linking. Every sentence generated is back-linked.",
            meta: "AUDIT_LOG",
            image: "/feature-03-traceability.png"
        },
        {
            id: "04",
            title: "Security Core",
            desc: "Air-gapped deployment capable. Local LLM inference support. 100% Data Sovereignty.",
            meta: "SEC_LEVEL_3",
            image: "/feature-04-security.png"
        },
        {
            id: "05",
            title: "Human-AI Symbiosis",
            desc: "Real-time collaborative editing. Lock specific sections while AI iterates on others.",
            meta: "INTERACTIVE_EDIT",
            image: "/feature-05-symbiosis.png"
        },
        {
            id: "06",
            title: "Visual Synthesis",
            desc: "Auto-generate Gantt charts, organizational structures, and flowcharts from text.",
            meta: "DIAGRAM_GEN",
            image: "/feature-06-visuals.png"
        },
        {
            id: "07",
            title: "Deck Generation",
            desc: "One-click transformation from written proposal to client-ready PowerPoint slides.",
            meta: "SLIDE_AUTO",
            image: "/feature-07-slides.png"
        },
        {
            id: "08",
            title: "Compliance Guard",
            desc: "Automated audit against tender constraints. Red-flags non-compliant terminology.",
            meta: "RISK_AUDIT",
            image: "/feature-08-compliance.png"
        }
    ];

    return (
        <section className="bg-background-secondary border-t border-black dark:border-white">
            <div className="container mx-auto px-4 md:px-6 py-24 pb-32">
                <div className="mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-foreground">Core Capabilities</h2>
                    <p className="text-muted-foreground max-w-2xl text-lg font-light">
                        Designed for bid managers who demand precision. No hallucinations, just verification.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-black dark:border-white bg-background">
                    {features.map((f) => (
                        <div key={f.id} className="group border-r border-b border-black dark:border-white hover:bg-background-secondary transition-colors cursor-pointer flex flex-col h-full">
                            <div className="aspect-[4/3] w-full relative border-b border-black dark:border-white grayscale group-hover:grayscale-0 transition-all duration-500 overflow-hidden">
                                <Image
                                    src={f.image}
                                    alt={f.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="p-6 md:p-8 flex flex-col flex-grow justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="font-mono text-xs font-bold text-foreground bg-black text-white dark:bg-white dark:text-black px-1">
                                            [{f.id}]
                                        </span>
                                        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                                            {f.meta}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-xl mb-3 text-foreground tracking-tight">
                                        {f.title}
                                    </h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed font-normal">
                                        {f.desc}
                                    </p>
                                </div>

                                <div className="mt-8 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                                    <ArrowUpRight className="h-5 w-5 text-foreground" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
                        /// END OF FEATURE_SET
                    </p>
                </div>
            </div>
        </section>
    );
}
