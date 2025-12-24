"use client";
import { useMemo } from "react";
import { Unit } from "@/types/types";
import UnitCard from "./UnitCard";
import Pagination from "./Pagination";

interface GridViewProps {
  units: Unit[];
  currentPage: number;
  itemsPerPage: number;
  onUnitClick: (unitId: string, propertyId: string) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}

// Empty state component
function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-white shadow-inner flex items-center justify-center">
            <svg
              className="w-10 h-10 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-900 mb-3">
          No units found
        </h3>
        <p className="text-slate-500 mb-8 leading-relaxed">
          We could not find any units matching your criteria. Try adjusting your
          filters or search for a different location.
        </p>

        <button
          type="button"
          onClick={onClearFilters}
          className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}

export default function GridView({
  units,
  currentPage,
  itemsPerPage,
  onUnitClick,
  onPageChange,
  onClearFilters,
}: GridViewProps) {
  // Calculate pagination
  const totalPages = Math.ceil(units.length / itemsPerPage);
  const paginatedUnits = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return units.slice(start, start + itemsPerPage);
  }, [units, currentPage, itemsPerPage]);

  if (units.length === 0) {
    return <EmptyState onClearFilters={onClearFilters} />;
  }

  return (
    <div className="max-w-[1800px] mx-auto px-4 py-6 lg:px-8 lg:py-8">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
        {paginatedUnits.map((unit, index) => (
          <div
            key={unit.unit_id}
            className="animate-fade-in-up"
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: "backwards",
            }}
          >
            <UnitCard
              unit={unit}
              onClick={() => onUnitClick(unit.unit_id, unit.property_id)}
              index={index}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 pt-8 border-t border-slate-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
