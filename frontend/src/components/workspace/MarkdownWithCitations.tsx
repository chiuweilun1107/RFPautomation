/**
 * MarkdownWithCitations Component
 *
 * Renders Markdown content with embedded citation badges.
 * Uses ReactMarkdown for proper Markdown parsing and rendering,
 * while preserving the citation badge click functionality.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CitationBadge, Evidence } from './CitationBadge';
import type { Components } from 'react-markdown';

interface MarkdownWithCitationsProps {
    text: string;
    evidences?: Record<string | number, Evidence>;
    onCitationClick?: (evidence: Evidence) => void;
}

/**
 * Processes text nodes to extract citation markers and render badges
 */
function processCitationText(
    text: string,
    evidences: Record<string | number, Evidence>,
    onCitationClick?: (evidence: Evidence) => void
): React.ReactNode[] {
    // Split by citation pattern [1], [12], etc.
    const parts = text.split(/(\[\d+\])/g);

    return parts.map((part, index) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match) {
            const id = parseInt(match[1]);
            const evidence = evidences[id] || evidences[String(id)];

            if (evidence) {
                return (
                    <CitationBadge
                        key={`citation-${id}-${index}`}
                        evidence={evidence}
                        onClick={onCitationClick}
                    />
                );
            }
            // No evidence found, render as plain text
            return <span key={`no-evidence-${index}`} className="text-muted-foreground">{part}</span>;
        }
        // Normal text
        return part;
    });
}

/**
 * Custom ReactMarkdown components to inject citation badges
 */
function createCustomComponents(
    evidences: Record<string | number, Evidence>,
    onCitationClick?: (evidence: Evidence) => void
): Partial<Components> {
    return {
        // Process text nodes to insert citation badges
        p: ({ children }) => {
            const processedChildren = React.Children.map(children, (child) => {
                if (typeof child === 'string') {
                    return processCitationText(child, evidences, onCitationClick);
                }
                return child;
            });
            return <p className="mb-4 last:mb-0">{processedChildren}</p>;
        },

        // Ordered list styling
        ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-6 mb-4 space-y-2">
                {children}
            </ol>
        ),

        // Unordered list styling
        ul: ({ children }) => (
            <ul className="list-disc list-outside ml-6 mb-4 space-y-2">
                {children}
            </ul>
        ),

        // List item - process text for citations
        li: ({ children }) => {
            const processedChildren = React.Children.map(children, (child) => {
                if (typeof child === 'string') {
                    return processCitationText(child, evidences, onCitationClick);
                }
                return child;
            });
            return <li className="pl-1">{processedChildren}</li>;
        },

        // Strong (bold) text
        strong: ({ children }) => {
            const processedChildren = React.Children.map(children, (child) => {
                if (typeof child === 'string') {
                    return processCitationText(child, evidences, onCitationClick);
                }
                return child;
            });
            return <strong className="font-bold">{processedChildren}</strong>;
        },

        // Emphasis (italic) text
        em: ({ children }) => {
            const processedChildren = React.Children.map(children, (child) => {
                if (typeof child === 'string') {
                    return processCitationText(child, evidences, onCitationClick);
                }
                return child;
            });
            return <em className="italic">{processedChildren}</em>;
        },

        // Headings
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
        h4: ({ children }) => <h4 className="text-base font-bold mb-2">{children}</h4>,

        // Code blocks
        code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
                return <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
            }
            return (
                <pre className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded overflow-x-auto mb-4">
                    <code className="text-sm font-mono">{children}</code>
                </pre>
            );
        },

        // Blockquotes
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 italic my-4">
                {children}
            </blockquote>
        ),
    };
}

/**
 * Renders Markdown text with embedded citation badges
 */
export function MarkdownWithCitations({
    text,
    evidences = {},
    onCitationClick
}: MarkdownWithCitationsProps) {
    const customComponents = React.useMemo(
        () => createCustomComponents(evidences, onCitationClick),
        [evidences, onCitationClick]
    );

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={customComponents}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
}
