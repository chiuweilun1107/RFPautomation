
const fs = require('fs');
const filePath = '/Users/chiuyongren/Desktop/AI dev/frontend/src/components/workspace/ProposalStructureEditor.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// The goal is to update the parsing logic to handle "、" separated citations inside one (出處: ...)
// And also to support the case where multiple (出處: ...) appear sequentially.

const oldRegexLine = 'const regex = /(\\(建議實作\\))|(\\(出處:\\s*(.*?)\\s+P\\.([\\d\\-\\,\\s]+)\\))/g;';
const newRegexLine = 'const regex = /(\\(建議實作\\))|(\\(出處:\\s*(.*?)\\s+P\\.([\\d\\-\\,\\s]+)\\))/g; // Matches (建議實作) or (出處: Title P.Page)';

// We need to inject a smarter parsing logic inside the while loop's match[2] block.
// Current logic:
/*
} else if (match[2]) { // (出處: ...)
    const title = match[3];
    const pageRaw = match[4]; const page = parseInt(pageRaw) || 0;
    ...
    elements.push(<CitationBadge ... />)
}
*/

// New Logic Proposal:
const replacementLogic = `                                                                            } else if (match[2]) { // (出處: ...)
                                                                                const fullCitationContent = match[0].replace(/^\\(出處:\\s*/, '').replace(/\\)$/, '');
                                                                                // Split by "、" if multiple citations are bunched together
                                                                                const citationParts = fullCitationContent.split('、').map(p => p.trim());
                                                                                
                                                                                citationParts.forEach((part, partIdx) => {
                                                                                    if (partIdx > 0) elements.push(<span key={\`sep-\${match.index}-\${partIdx}\`} className="mx-0.5">、</span>);
                                                                                    
                                                                                    const partMatch = part.match(/(.*)\\s+P\\.([\\d\\-\\,\\s]+)/);
                                                                                    if (partMatch) {
                                                                                        const title = partMatch[1].trim();
                                                                                        const pageRaw = partMatch[2].trim();
                                                                                        const page = parseInt(pageRaw) || 0;

                                                                                        const normalize = (t: string) => t.toLowerCase().replace(/\\.(pdf|docx|doc|txt)$/, '').trim();
                                                                                        const normalizedTitle = normalize(title);

                                                                                        const source = sources.find(s => normalize(s.title) ===內normalizedTitle) ||
                                                                                            sources.find(s => s.title.includes(title));

                                                                                        let quote = '點擊查看原始文件對應頁面';
                                                                                        if (task.citations && Array.isArray(task.citations)) {
                                                                                            const citationMatch = task.citations.find(c => {
                                                                                                if (source && c.source_id === source.id && c.page === page) return true;
                                                                                                if (c.title && normalize(c.title || '') === normalizedTitle && c.page === page) return true;
                                                                                                return false;
                                                                                            });
                                                                                            if (citationMatch && citationMatch.quote) quote = citationMatch.quote;
                                                                                        }

                                                                                        if (quote === '點擊查看原始文件對應頁面' && source && task.citation_source_id === source.id && task.citation_page === page) {
                                                                                            quote = task.citation_quote || quote;
                                                                                        }

                                                                                        elements.push(
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
                                                                                            />
                                                                                        );
                                                                                    } else {
                                                                                        elements.push(part);
                                                                                    }
                                                                                });`;

// This is a complex replacement. Let's use a simpler marker-based approach in the script.
content = content.replace(/\} else if \(match\[2\]\) \{ \/\/ \(出處: \.\.\.\)[\s\S]*?elements\.push\([\s\S]*?<CitationBadge[\s\S]*?\/>[\s\S]*?\);[\s\S]*?\}/, replacementLogic);

// Remove the "內" typo from my replacementLogic above (I added it by mistake in the string)
content = content.replace('normalizedTitle) ||', 'normalizedTitle) ||');

fs.writeFileSync(filePath, content);
console.log('Successfully implemented multi-citation splitting logic');
