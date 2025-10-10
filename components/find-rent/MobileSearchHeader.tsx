// components/search/MobileSearchHeader.tsx
import { FaSearch, FaTimes, FaMap, FaList } from "react-icons/fa";
import { BsGridFill } from "react-icons/bs";
import { MdFilterList } from "react-icons/md";
import { FilterState, Unit } from "./types";
import { sanitizeInput } from "./utils";

interface MobileSearchHeaderProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  viewMode: string;
  setViewMode: (mode: string) => void;
  filteredUnits: Unit[];
  showMobileFilters: boolean;
  setShowMobileFilters: (show: boolean) => void;
  MobileFiltersPanel: React.FC<any>;
  ActiveFilters: React.FC<any>;
}

export default function MobileSearchHeader({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  filteredUnits,
  showMobileFilters,
  setShowMobileFilters,
  MobileFiltersPanel,
  ActiveFilters,
}: MobileSearchHeaderProps) {
  // ... (Paste the MobileSearchHeader content here)
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="px-3 py-2 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 mb-3 sm:mb-0">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by location, property name..."
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev: FilterState) => ({
                  ...prev,
                  searchQuery: sanitizeInput(e.target.value),
                }))
              }
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-emerald-500 focus:outline-none text-sm bg-gray-50 focus:bg-white transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() =>
                  setFilters((prev: FilterState) => ({
                    ...prev,
                    searchQuery: "",
                  }))
                }
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-sm" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden p-2.5 bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <MdFilterList className="text-emerald-600 text-lg" />
          </button>
        </div>

        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm">
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                {filteredUnits.length}
              </span>
              <span className="text-gray-600 ml-1">units available</span>
            </span>
          </div>

          <div className="flex bg-gradient-to-r from-blue-100 to-emerald-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-white text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <BsGridFill className="inline mr-2 text-blue-600" />
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-white text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FaList className="inline mr-2 text-emerald-600" />
              List
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === "map"
                  ? "bg-white text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FaMap className="inline mr-2 text-teal-600" />
              Map
            </button>
          </div>
        </div>

        {showMobileFilters && (
          <MobileFiltersPanel filters={filters} setFilters={setFilters} />
        )}

        <ActiveFilters filters={filters} setFilters={setFilters} />
      </div>
    </div>
  );
}
