"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  baseUrl?: string;
  showPreviousNext?: boolean;
}

export function Paginator({
  currentPage,
  totalPages,
  onPageChange,
  baseUrl,
  showPreviousNext = true,
}: PaginatorProps) {
  if (totalPages <= 1) return null;

  const generatePageLink = (page: number) => {
    if (baseUrl) {
      return `${baseUrl}?page=${page}`;
    }
    return undefined;
  };

  const handlePageChange = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <PaginationItem key={1}>
          <PaginationLink
            href={generatePageLink(1)}
            onClick={(e) => handlePageChange(1, e)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>,
      );
      if (startPage > 2) {
        pages.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            href={generatePageLink(i)}
            onClick={(e) => handlePageChange(i, e)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>,
        );
      }
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href={generatePageLink(totalPages)}
            onClick={(e) => handlePageChange(totalPages, e)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return pages;
  };

  return (
    <Pagination>
      <PaginationContent>
        {showPreviousNext && (
          <PaginationItem>
            <PaginationPrevious
              href={generatePageLink(currentPage - 1)}
              onClick={(e) => {
                if (currentPage <= 1) e.preventDefault();
                else handlePageChange(currentPage - 1, e);
              }}
              aria-disabled={currentPage <= 1}
              className={
                currentPage <= 1 ? "pointer-events-none opacity-50" : undefined
              }
            />
          </PaginationItem>
        )}

        {renderPageNumbers()}

        {showPreviousNext && (
          <PaginationItem>
            <PaginationNext
              href={generatePageLink(currentPage + 1)}
              onClick={(e) => {
                if (currentPage >= totalPages) e.preventDefault();
                else handlePageChange(currentPage + 1, e);
              }}
              aria-disabled={currentPage >= totalPages}
              className={
                currentPage >= totalPages
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
