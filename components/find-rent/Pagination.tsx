"use client";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = useMemo(() => {
    const arr: (number | "...")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        arr.push(i);
      }
    } else {
      arr.push(1);

      if (currentPage > 3) {
        arr.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        arr.push(i);
      }

      if (currentPage < totalPages - 2) {
        arr.push("...");
      }

      arr.push(totalPages);
    }

    return arr;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {/* Previous Button */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl font-medium text-sm
          transition-all duration-200
          ${
            currentPage === 1
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100 active:scale-95"
          }
        `}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((page, idx) =>
          page === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 sm:px-3 text-slate-400 text-sm"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-semibold text-sm
                transition-all duration-200 active:scale-95
                ${
                  page === currentPage
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/25"
                    : "text-slate-600 hover:bg-slate-100"
                }
              `}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl font-medium text-sm
          transition-all duration-200
          ${
            currentPage === totalPages
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100 active:scale-95"
          }
        `}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
