
import React from 'react';
import { CitationBadge, Evidence } from './CitationBadge';

interface CitationRendererProps {
    text: string;
    evidences?: Record<string | number, Evidence>; // Search by ID
    onCitationClick?: (evidence: Evidence) => void;
}

export function CitationRenderer({ text, evidences = {}, onCitationClick }: CitationRendererProps) {
    // Split text by citations like [1], [12], etc.
    // Regex: matches anything that looks like [digits]
    const parts = text.split(/(\[\d+\])/g);

    return (
        <span className="whitespace-pre-wrap leading-relaxed">
            {parts.map((part, index) => {
                const match = part.match(/^\[(\d+)\]$/);
                if (match) {
                    const id = parseInt(match[1]);
                    const evidence = evidences[id] || evidences[String(id)];

                    if (evidence) {
                        // Render Badge
                        return (
                            <CitationBadge
                                key={index}
                                evidence={evidence}
                                onClick={onCitationClick}
                            />
                        );
                    }
                    // If no evidence found for this ID, just render text
                    return <span key={index} className="text-muted-foreground">{part}</span>;
                }
                // Normal text
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
}
