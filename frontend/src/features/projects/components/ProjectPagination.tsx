import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProjectPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function ProjectPagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: ProjectPaginationProps) {
  // Show a window of pages
  const getVisiblePages = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages, start + 2);
    const actualStart = Math.max(1, end - 2);

    for (let i = actualStart; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-black/10 dark:border-white/10 mt-8">
      {/* Metadata Section */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic">Results_Per_Page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            disabled={!onPageSizeChange}
            className="bg-transparent border-b-2 border-black dark:border-white font-mono text-[10px] font-black px-1 pb-0.5 min-w-[32px] text-center focus:outline-none focus:border-[#FA4028] transition-colors cursor-pointer disabled:cursor-default"
          >
            {[12, 24, 48, 96].map((size) => (
              <option key={size} value={size}>
                {String(size).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
        <div className="text-[10px] font-mono font-bold opacity-40 uppercase tracking-[0.2em]">
          Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
        </div>
      </div>

      {/* Controls Section */}
      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="h-8 rounded-none border-black dark:border-white bg-white dark:bg-black font-mono text-[10px] font-black uppercase hover:bg-[#FA4028] hover:text-white disabled:opacity-30 transition-all group px-4"
          >
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
            PREV
          </Button>

          <div className="flex items-center gap-1.5">
            {visiblePages.map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                onClick={() => onPageChange(p)}
                className={cn(
                  "h-8 w-8 rounded-none border-black dark:border-white font-mono text-[10px] font-black transition-all",
                  currentPage === p
                    ? "bg-black text-white dark:bg-white dark:text-black cursor-default"
                    : "bg-white text-black dark:bg-black dark:text-white hover:bg-[#FA4028] hover:text-white hover:border-[#FA4028]"
                )}
              >
                {String(p).padStart(2, '0')}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="h-8 rounded-none border-black dark:border-white bg-white dark:bg-black font-mono text-[10px] font-black uppercase hover:bg-[#FA4028] hover:text-white disabled:opacity-30 transition-all group px-4"
          >
            NEXT
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Button>
        </div>
      ) : (
        <div className="h-8 text-[10px] font-mono font-bold opacity-20 uppercase tracking-widest flex items-center">
          // END_OF_DATA
        </div>
      )}
    </div>
  );
}
