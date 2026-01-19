
import React from 'react';
import { CitationRenderer } from './CitationRenderer';
import { CitationBadge, Evidence } from './CitationBadge';

interface RecursiveAssessmentRendererProps {
    data: any;
    evidences: Record<string, Evidence>;
    onCitationClick: (evidence: Evidence) => void;
    level?: number;
}

export function RecursiveAssessmentRenderer({
    data,
    evidences,
    onCitationClick,
    level = 0
}: RecursiveAssessmentRendererProps) {
    // If it's a string, just render it with CitationRenderer
    if (typeof data === 'string') {
        return (
            <div className="text-sm leading-relaxed whitespace-pre-line">
                <CitationRenderer
                    text={data}
                    evidences={evidences}
                    onCitationClick={onCitationClick}
                />
            </div>
        );
    }

    // If it's the standard leaf object { text: "...", citations: [...] }
    if (data && typeof data === 'object' && 'text' in data) {
        return (
            <div className="text-sm leading-relaxed whitespace-pre-line">
                <CitationRenderer
                    text={data.text}
                    evidences={evidences}
                    onCitationClick={onCitationClick}
                />
                {/* Render extracted citations if available */}
                {data.citationIds && Array.isArray(data.citationIds) && data.citationIds.length > 0 && (
                    <span className="ml-2 inline-flex gap-1 align-baseline">
                        {data.citationIds.map((id: number) => {
                            const evidence = evidences[id];
                            if (!evidence) return null;
                            return (
                                <CitationBadge
                                    key={id}
                                    evidence={evidence}
                                    onClick={onCitationClick}
                                />
                            );
                        })}
                    </span>
                )}
            </div>
        );
    }

    // If it's an array
    if (Array.isArray(data)) {
        return (
            <ul className="list-disc pl-5 space-y-2">
                {data.map((item, i) => (
                    <li key={i}>
                        <RecursiveAssessmentRenderer
                            data={item}
                            evidences={evidences}
                            onCitationClick={onCitationClick}
                            level={level + 1}
                        />
                    </li>
                ))}
            </ul>
        );
    }

    // If it's a nested object (e.g., summary.content)
    if (data && typeof data === 'object') {
        // Skip keys that are UI labels or metadata
        const keys = Object.keys(data).filter(k => k !== 'label' && k !== 'citations');

        return (
            <div className={`space-y-4 ${level > 0 ? 'ml-4' : ''}`}>
                {keys.map((key) => (
                    <div key={key} className="space-y-2">
                        {level < 4 && ( // Re-enable titles for all levels to ensure pain points/reasons are visible
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FA4028]/80 border-b border-black/5 dark:border-white/5 pb-1">
                                {key.replace(/_/g, ' ')}
                            </h4>
                        )}
                        <RecursiveAssessmentRenderer
                            data={data[key]}
                            evidences={evidences}
                            onCitationClick={onCitationClick}
                            level={level + 1}
                        />
                    </div>
                ))}
            </div>
        );
    }

    return null;
}
