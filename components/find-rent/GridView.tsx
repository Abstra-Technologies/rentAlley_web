"use client";
import { Search, MapPin, Sparkles, X } from "lucide-react";
import { Unit, FilterState } from "../../types/types";
import UnitCard from "./UnitCard";
import Pagination from "./Pagination";

interface GridViewProps {
  filteredUnits: Unit[];
  paginatedUnits: Unit[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onUnitClick: (unitId: string, propertyId: string) => void;
  onClearFilters: () => void;
  filters?: FilterState;
  DesktopFiltersPanel?: React.FC<any>;
  setFilters?: (filters: FilterState) => void;
}

export default function GridView({
  filteredUnits,
  paginatedUnits,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onUnitClick,
  onClearFilters,
  filters,
  DesktopFiltersPanel,
  setFilters,
}: GridViewProps) {
  return (
    <div className="flex gap-8">
      {/* Desktop Filters Sidebar */}
      {DesktopFiltersPanel && filters && setFilters && (
        <aside className="hidden lg:block w-[300px] flex-shrink-0">
          <div className="sticky top-28">
            <DesktopFiltersPanel filters={filters} setFilters={setFilters} />
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {filteredUnits.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="max-w-md w-full text-center px-6">
              {/* Animated Icon */}
              <div className="relative mx-auto w-28 h-28 mb-8">
                {/* Outer ring animation */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-200 animate-[spin_20s_linear_infinite]" />
                {/* Inner circle */}
                <div className="absolute inset-3 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-full flex items-center justify-center">
                  <div className="relative">
                    <Search
                      className="w-10 h-10 text-gray-300"
                      strokeWidth={1.5}
                    />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Heading */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No properties found
              </h3>

              {/* Description */}
              <p className="text-gray-500 text-base mb-8 leading-relaxed">
                We couldn&apos;t find any properties matching your criteria. Try
                adjusting your filters to see more options.
              </p>

              {/* Tips Card */}
              <div className="bg-white rounded-2xl p-6 mb-8 text-left border border-gray-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                      Quick tips
                    </h4>
                    <ul className="space-y-2.5 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        <span>Use broader search terms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        <span>Remove some filters to see more results</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        <span>Adjust your price or size range</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={onClearFilters}
                className="
                  inline-flex items-center gap-2.5 px-8 py-4
                  bg-gradient-to-r from-blue-600 to-emerald-600 
                  text-white rounded-xl font-semibold
                  shadow-lg shadow-emerald-600/20
                  hover:shadow-xl hover:shadow-emerald-600/30 
                  hover:-translate-y-0.5
                  active:translate-y-0 active:shadow-lg
                  transition-all duration-200
                "
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>

              {/* Help Link */}
              <p className="text-sm text-gray-400 mt-8">
                Need help?{" "}
                <a
                  href="/contact"
                  className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline underline-offset-2"
                >
                  Contact our team
                </a>
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  Available Properties
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                    –{Math.min(currentPage * itemsPerPage, totalItems)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {totalItems}
                  </span>{" "}
                  {totalItems === 1 ? "property" : "properties"}
                </p>
              </div>

              {/* Mobile Results Count Badge */}
              <div className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-full border border-emerald-100/60">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-gray-700">
                  {totalItems} found
                </span>
              </div>
            </div>

            {/* Property Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
              {paginatedUnits.map((unit, index) => (
                <div
                  key={unit.unit_id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <UnitCard
                    unit={unit}
                    onClick={() => onUnitClick(unit.unit_id, unit.property_id)}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 pt-6 border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={onPageChange}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
