import { FaSearch } from "react-icons/fa";
import { Unit, FilterState } from "./types";
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
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {filteredUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FaSearch className="text-gray-300 text-5xl mb-4" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">
              No units found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters to see more results
            </p>
            <button
              onClick={onClearFilters}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {paginatedUnits.map((unit) => (
              <UnitCard
                key={unit.unit_id}
                unit={unit}
                onClick={() => onUnitClick(unit.unit_id, unit.property_id)}
              />
            ))}
          </div>
        )}
      </div>

      {filteredUnits.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}
