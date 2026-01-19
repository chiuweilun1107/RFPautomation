
const fs = require('fs');
const filePath = '/Users/chiuyongren/Desktop/AI dev/frontend/src/components/workspace/ProposalStructureEditor.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const whileLoopPattern = /while \(\(match = regex\.exec\(text\)\) !== null\) \{[\s\S]*?lastIndex = regex\.lastIndex;\s*\}\s*\}/;

const cleanWhileLoop = `while ((match = regex.exec(text)) !== null) {
                                                                            if (match.index > lastIndex) {
                                                                                elements.push(text.substring(lastIndex, match.index));
                                                                            }

                                                                            if (match[1]) { // (建議實作)
                                                                                elements.push(
                                                                                    <CitationBadge
                                                                                        key={match.index}
                                                                                        evidence={{
                                                                                            id: 0,
                                                                                            source_id: 'suggestion',
                                                                                            page: 0,
                                                                                            source_title: '系統建議',
                                                                                            sourceType: 'suggestion',
                                                                                            quote: '此項目為系統根據專業經驗建議實作的功能'
                                                                                        }}
                                                                                        customTrigger={
                                                                                            <Badge variant="outline" className="inline-flex items-center gap-1 ml-1 align-text-bottom bg-red-50 text-red-600 border-red-200 hover:bg-red-100 cursor-help select-none px-1.5 py-0 h-5 text-[10px]">
                                                                                                <Sparkles className="w-2.5 h-2.5" />
                                                                                                建議實作
                                                                                            </Badge>
                                                                                        }
                                                                                    />
                                                                                );
                                                                            } else if (match[2]) { // (出處: ...)
                                                                                const fullCitationContent = match[0].replace(/^\\(出處:\\s*/, '').replace(/\\)$/, '');
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

                                                                                        const source = sources.find(s => normalize(s.title) === normalizedTitle) ||
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
                                                                                                customTrigger={
                                                                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0 rounded-md bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-300 text-[10px] hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer border border-blue-100 dark:border-blue-900/30 font-medium whitespace-nowrap ml-1 align-middle">
                                                                                                        <FileText className="w-2.5 h-2.5" />
                                                                                                        <span className="truncate max-w-[120px]">{title}</span>
                                                                                                        <span className="opacity-40">|</span>
                                                                                                        <span>P.{pageRaw}</span>
                                                                                                    </span>
                                                                                                }
                                                                                            />
                                                                                        );
                                                                                    } else {
                                                                                        elements.push(part);
                                                                                    }
                                                                                });
                                                                            }
                                                                            lastIndex = regex.lastIndex;
                                                                        }`;

// Let's use a more robust way to find the indices
const startMarker = 'while ((match = regex.exec(text)) !== null) {';
const endMarker = 'if (lastIndex < text.length) {';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    const newContent = content.substring(0, startIndex) + cleanWhileLoop + '\n                                                                        ' + content.substring(endIndex);
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully overhauled the while loop block.');
} else {
    console.error('Markers not found. Manual intervention required.');
}
