
const fs = require('fs');
const filePath = '/Users/chiuyongren/Desktop/AI dev/frontend/src/components/workspace/ProposalStructureEditor.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// We need to inject the customTrigger into our multi-citation block.
// I'll search for the elements.push(<CitationBadge block I recently added.

const newCitationBadgeStyle = `                                                                                        elements.push(
                                                                                            <CitationBadge
                                                                                                key={\`\${match.index}-\${partIdx}\`}
                                                                                                evidence={{
                                                                                                    id: page,
                                                                                                    source_id: source?.id || '',
                                                                                                    page: page,
                                                                                                    source_title: title,
                                                                                                    sourceType: title.includes('附錄') ? 'internal' : (title.includes('需求') ? 'tender' : 'external'),
                                                                                                    quote: quote
                                                                                                }}
                                                                                                onClick={(evidence) => {
                                                                                                    if (source) {
                                                                                                        setSelectedEvidence({
                                                                                                            ...evidence,
                                                                                                            source_id: source.id,
                                                                                                            source_title: source.title,
                                                                                                            id: page
                                                                                                        });
                                                                                                    }
                                                                                                }}
                                                                                                customTrigger={
                                                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0 rounded-md bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-300 text-[10px] hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer border border-blue-100 dark:border-blue-900/30 font-medium whitespace-nowrap ml-1 align-middle">
                                                                                                        <FileText className="w-2.5 h-2.5" />
                                                                                                        <span className="truncate max-w-[120px]">{title}</span>
                                                                                                        <span className="opacity-40">|</span>
                                                                                                        <span>P.{pageRaw}</span>
                                                                                                    </span>
                                                                                                }
                                                                                            />
                                                                                        );`;

// Regex to find the existing CitationBadge block inside citationParts.forEach
content = content.replace(/elements\.push\(\s*<CitationBadge[\s\S]*?onClick=\{[\s\S]*?\}\s*\/?>\s*\);/g, newCitationBadgeStyle);

fs.writeFileSync(filePath, content);
console.log('Successfully restored custom badge style for multiple citations');
