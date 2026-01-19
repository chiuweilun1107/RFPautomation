import { useState, useCallback, useMemo } from 'react';

interface PaginationOptions {
  initialPage?: number;
  pageSize?: number;
  totalItems?: number;
}

/**
 * 分页管理 Hook
 * 统一管理当前页、每页数量、总数、计算逻辑
 *
 * @example
 * const pagination = usePagination({ pageSize: 20, totalItems: 100 });
 * const items = allItems.slice(pagination.startIndex, pagination.endIndex);
 */
export function usePagination<T>(
  items: T[] = [],
  options: PaginationOptions = {}
) {
  const { initialPage = 1, pageSize = 20, totalItems } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);

  const total = totalItems || items.length;

  // 计算总页数
  const totalPages = useMemo(() => {
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);

  // 计算开始和结束索引
  const { startIndex, endIndex } = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    return { startIndex: start, endIndex: end };
  }, [currentPage, pageSize, total]);

  // 获取当前页的数据
  const currentPageData = useMemo(() => {
    if (!items.length) return [];
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  // 分页操作函数
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  return {
    // 当前状态
    currentPage,
    pageSize,
    total,
    totalPages,
    startIndex,
    endIndex,
    currentPageData,

    // 计算值
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,

    // 操作函数
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,

    // 便利函数：改变页面大小
    setPageSize: (newSize: number) => {
      // 注意：这需要在外部状态中管理
      return newSize;
    },

    // 便利函数：获取分页信息字符串
    getInfo: () =>
      `Page ${currentPage} of ${totalPages} (${startIndex + 1}-${endIndex} of ${total})`,
  };
}
