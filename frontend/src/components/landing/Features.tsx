export function Features() {
    const features = [
        {
            title: "Multi-Format Parsing",
            description: "Seamlessly ingest Taiwan Government DOCX tenders, Security Excel sheets, and legacy PDFs. We preserve your original formatting.",
            icon: "📄",
        },
        {
            title: "Adaptive Knowledge Loop",
            description: "Our AI learns from your edits. Approved responses are automatically fed back into the vector database to improve future accuracy.",
            icon: "🧠",
        },
        {
            title: "Private & Secure",
            description: "Built on Supabase and n8n Self-hosted architecture. Your sensitive data never leaves your controlled infrastructure.",
            icon: "🔒",
        },
        {
            title: "Real-time Collaboration",
            description: "Work together with your team. Lock sections to prevent conflicts and use AI Assist to refine text iteratively.",
            icon: "👥",
        },
    ];

    return (
        <section className="container mx-auto space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-6xl">Feature-rich</h2>
                <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7 text-gray-500">
                    Everything you need to win more bids with less effort.
                </p>
            </div>
            <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-2">
                {features.map((feature) => (
                    <div key={feature.title} className="relative overflow-hidden rounded-lg border bg-background p-2">
                        <div className="flex h-[180px] flex-col justify-between rounded-md p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                            <div className="space-y-2">
                                <h3 className="font-bold">{feature.icon} {feature.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
