"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    const halfWindow = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, currentPage - halfWindow);
    let endPage = Math.min(totalPages, currentPage + halfWindow);

    if (endPage - startPage < maxPagesToShow - 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      } else {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        <span className="font-medium text-gray-900">{startItem}</span>
        <span className="text-gray-500"> - </span>
        <span className="font-medium text-gray-900">{endItem}</span>
        <span className="text-gray-500"> of </span>
        <span className="font-medium text-gray-900">{totalItems}</span>
        <span className="text-gray-500"> items</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 sm:p-2.5 rounded-lg border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-emerald-300 text-gray-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          {pageNumbers.map((page, idx) => (
            <div key={idx}>
              {page === "..." ? (
                <span className="px-2 py-1 sm:px-3 sm:py-2 text-gray-500 text-sm">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  disabled={page === currentPage}
                  className={`min-w-[2.25rem] sm:min-w-[2.5rem] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    page === currentPage
                      ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent hover:border-emerald-300"
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 sm:p-2.5 rounded-lg border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-emerald-300 text-gray-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
          aria-label="Next page"
        >
          <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="text-sm text-gray-600 text-center sm:text-right">
        Page
        <span className="font-medium text-gray-900 mx-1">{currentPage}</span>
        of
        <span className="font-medium text-gray-900 mx-1">{totalPages}</span>
      </div>
    </div>
  );
}
