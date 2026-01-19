import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface TocItem {
    title: string;
    level: number;
    page?: string;
    id: string;
}

interface TableOfContentsProps {
    content: string;
    onNavigate?: (itemId: string) => void;
}

/**
 * 解析 markdown 內容，提取章節結構
 * 支持兩種格式：
 * 1. Markdown 標題：## 章節標題
 * 2. 目錄格式：[章節標題 頁碼](.)
 */
function parseTableOfContents(content: string): TocItem[] {
    const items: TocItem[] = [];
    const lines = content.split('\n');

    // 檢測是否有明確的目錄區段
    let inTocSection = false;
    let tocSectionEnd = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 檢測目錄開始
        if (line.includes('目　　錄') || line.includes('目錄')) {
            inTocSection = true;
            continue;
        }

        // 如果在目錄區段中
        if (inTocSection && !tocSectionEnd) {
            // 解析目錄格式：[章節標題 頁碼](.)
            const tocMatch = line.match(/\[(.*?)\s+(\d+)\]\(\.\)/);
            if (tocMatch) {
                const [, title, page] = tocMatch;
                // 清理標題中的編號格式
                const cleanTitle = title.replace(/^[壹貳參肆伍陸柒捌玖拾一二三四五六七八九十\d]+、\s*/, '');
                items.push({
                    title: cleanTitle.trim(),
                    level: 1,
                    page: page,
                    id: `toc-${items.length}`
                });
                continue;
            }

            // 如果遇到空行或其他內容，結束目錄區段
            if (line === '' || (!line.startsWith('[') && !line.includes('頁碼'))) {
                if (items.length > 0) {
                    tocSectionEnd = true;
                }
            }
        }
    }

    // 如果沒有找到目錄格式，則解析 markdown 標題
    if (items.length === 0) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // 解析 markdown 標題
            const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
            if (headingMatch) {
                const [, hashes, title] = headingMatch;
                const level = hashes.length;

                // 只處理 1-3 級標題
                if (level <= 3) {
                    // 清理標題中的編號
                    const cleanTitle = title
                        .replace(/^[壹貳參肆伍陸柒捌玖拾一二三四五六七八九十\d]+、\s*/, '')
                        .replace(/^[\d.]+\s+/, '');

                    items.push({
                        title: cleanTitle.trim(),
                        level: level,
                        id: `heading-${items.length}`
                    });
                }
            }
        }
    }

    return items;
}

export function TableOfContents({ content, onNavigate }: TableOfContentsProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);

    // 使用 useMemo 避免在 effect 中調用 setState
    const tocItems = useMemo(() => {
        if (content) {
            return parseTableOfContents(content);
        }
        return [];
    }, [content]);

    const handleNavigate = (item: TocItem) => {
        setActiveId(item.id);
        if (onNavigate) {
            onNavigate(item.id);
        }
    };

    // 如果沒有章節，不顯示
    if (tocItems.length === 0) {
        return null;
    }

    return (
        <div className="border-b border-black/10 dark:border-white/10 bg-gray-50/50 dark:bg-gray-900/50">
            {/* 摺疊按鈕 */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full px-4 py-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <span>TABLE OF CONTENTS ({tocItems.length})</span>
                {isCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                ) : (
                    <ChevronDown className="w-3 h-3" />
                )}
            </button>

            {/* 章節列表 */}
            {!isCollapsed && (
                <div className="px-2 py-2 max-h-[240px] overflow-y-auto custom-scrollbar">
                    <div className="space-y-0.5">
                        {tocItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavigate(item)}
                                className={`
                                    w-full text-left px-2 py-1.5 text-[11px] rounded-none
                                    transition-all duration-150
                                    hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black
                                    ${activeId === item.id
                                        ? 'bg-black text-white dark:bg-white dark:text-black font-bold'
                                        : 'text-gray-700 dark:text-gray-300'
                                    }
                                `}
                                style={{
                                    paddingLeft: `${8 + (item.level - 1) * 12}px`
                                }}
                            >
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="flex-1 truncate">
                                        {item.title}
                                    </span>
                                    {item.page && (
                                        <span className="text-[9px] opacity-60 flex-shrink-0">
                                            p.{item.page}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
