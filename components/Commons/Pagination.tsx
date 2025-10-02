"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface Props {
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
                                   }: Props) {
    const getPageNumbers = () => {
        const pages: (number | "...")[] = [];
        const maxVisible = typeof window !== "undefined" && window.innerWidth < 640 ? 3 : 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 2) {
                pages.push(1, 2, 3, "...", totalPages);
            } else if (currentPage >= totalPages - 1) {
                pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, "...", currentPage, "...", totalPages);
            }
        }
        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-b-xl">
            {/* Info */}
            <div className="text-sm text-gray-600 order-2 sm:order-1">
                Showing <span className="font-semibold text-blue-700">{startItem}</span>-
                <span className="font-semibold text-blue-700">{endItem}</span> of{" "}
                <span className="font-semibold text-emerald-700">{totalItems}</span> units
            </div>

            {/* Buttons */}
            <nav className="flex items-center gap-1 order-1 sm:order-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-l-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <FaChevronLeft className="w-3 h-3" />
                </button>

                {getPageNumbers().map((page, index) =>
                        page === "..." ? (
                            <span key={index} className="px-3 py-2 text-sm text-gray-500">
              ...
            </span>
                        ) : (
                            <button
                                key={index}
                                onClick={() => onPageChange(page as number)}
                                className={`px-3 py-2 text-sm font-medium border transition-all ${
                                    currentPage === page
                                        ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-transparent shadow-md"
                                        : "bg-white border-gray-300 text-gray-600 hover:bg-blue-50"
                                }`}
                            >
                                {page}
                            </button>
                        )
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-r-md hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <FaChevronRight className="w-3 h-3" />
                </button>
            </nav>
        </div>
    );
}
