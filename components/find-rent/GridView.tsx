import { FaSearch, FaMapMarkerAlt, FaFilter } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi";
import { Unit } from "../../types/types";
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
}: GridViewProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-auto">
        {filteredUnits.length === 0 ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-12">
            <div className="max-w-lg w-full text-center">
              {/* Animated Icon Container */}
              <div className="relative mx-auto w-32 h-32 mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <div className="relative">
                    <FaSearch className="text-gray-300 text-5xl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <FaMapMarkerAlt className="text-white text-xs" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Heading */}
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                No Properties Found
              </h3>

              {/* Description */}
              <p className="text-gray-600 text-base sm:text-lg mb-6 leading-relaxed">
                We couldn't find any units matching your search criteria. Try
                adjusting your filters to discover more available properties.
              </p>

              {/* Suggestions Box */}
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl p-6 mb-8 text-left border border-blue-100">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                    <HiSparkles className="text-emerald-500 text-lg" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Quick Tips
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>Try using broader search terms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>Remove some filters to see more results</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>Check for spelling errors in your search</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>Adjust your price or size range</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={onClearFilters}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-emerald-600 text-white rounded-xl font-semibold text-base shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:scale-105 transition-all duration-300 active:scale-95"
              >
                <FaFilter className="text-lg" />
                <span>Clear All Filters</span>
              </button>

              {/* Helper Text */}
              <p className="text-sm text-gray-500 mt-6">
                Need help finding the perfect property?{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Contact our team
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Results Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                    Available Properties
                  </h2>
                  <p className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                      {Math.min(
                        (currentPage - 1) * itemsPerPage + 1,
                        totalItems
                      )}
                      -{Math.min(currentPage * itemsPerPage, totalItems)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                      {totalItems}
                    </span>{" "}
                    {totalItems === 1 ? "property" : "properties"}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid Container - Better Card Sizing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
              {paginatedUnits.map((unit) => (
                <UnitCard
                  key={unit.unit_id}
                  unit={unit}
                  onClick={() => onUnitClick(unit.unit_id, unit.property_id)}
                />
              ))}
            </div>

            {/* Loading Skeleton Placeholder - Hidden when loaded */}
            {paginatedUnits.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
                {[...Array(8)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-3xl overflow-hidden shadow-md animate-pulse"
                  >
                    <div className="h-56 sm:h-64 bg-gradient-to-br from-gray-200 to-gray-300"></div>
                    <div className="p-5 sm:p-6">
                      <div className="h-4 bg-gray-200 rounded-full mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded-full mb-4 w-3/4"></div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="h-12 bg-gray-200 rounded-xl"></div>
                        <div className="h-12 bg-gray-200 rounded-xl"></div>
                      </div>
                      <div className="h-12 bg-gray-200 rounded-xl mb-3"></div>
                      <div className="h-10 bg-gray-200 rounded-xl"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {filteredUnits.length > 0 && (
        <div className="border-t border-gray-100 bg-white/80 backdrop-blur-sm">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}
    </div>
  );
}
