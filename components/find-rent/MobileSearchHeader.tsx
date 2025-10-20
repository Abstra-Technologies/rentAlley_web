import { useState, useEffect, useCallback } from "react";
import { Search, X, MapPin, List, Grid3x3, Filter } from "lucide-react";
import { FilterState, Unit } from "../../types/types";

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
  const [localSearchQuery, setLocalSearchQuery] = useState(filters.searchQuery);
  const [showSearchFocus, setShowSearchFocus] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev: FilterState) => ({
        ...prev,
        searchQuery: localSearchQuery,
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, setFilters]);

  useEffect(() => {
    setLocalSearchQuery(filters.searchQuery);
  }, [filters.searchQuery]);

  const handleSearchClear = useCallback(() => {
    setLocalSearchQuery("");
    setFilters((prev: FilterState) => ({
      ...prev,
      searchQuery: "",
    }));
  }, [setFilters]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      const sanitized = value.slice(0, 100);
      setLocalSearchQuery(sanitized);
    },
    []
  );

  const viewModeButtons = [
    { mode: "grid", label: "Grid", icon: Grid3x3 },
    { mode: "list", label: "List", icon: List },
    { mode: "map", label: "Map", icon: MapPin },
  ];

  return (
    <>
      {/* Main Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-blue-100 shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          {/* Mobile Search Bar */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="flex-1 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search location, property..."
                  value={localSearchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchFocus(true)}
                  onBlur={() => setShowSearchFocus(false)}
                  className="w-full pl-10 pr-10 py-2.5 border-2 border-blue-100 rounded-lg sm:rounded-xl focus:border-emerald-500 focus:outline-none text-sm bg-gray-50 focus:bg-white transition-all duration-200"
                />
                {localSearchQuery && (
                  <button
                    onClick={handleSearchClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden p-2.5 bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-emerald-200 rounded-lg sm:rounded-xl hover:bg-emerald-100 transition-colors active:scale-95"
              aria-label="Toggle filters"
              aria-pressed={showMobileFilters}
            >
              <Filter className="w-5 h-5 text-emerald-600" />
            </button>
          </div>

          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                  {filteredUnits.length}
                </span>
                <span className="ml-1">
                  {filteredUnits.length === 1 ? "unit" : "units"} found
                </span>
              </span>
            </div>

            <div className="flex gap-2 bg-blue-50 rounded-lg p-1 border border-blue-100">
              {viewModeButtons.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === mode
                      ? "bg-white text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  aria-pressed={viewMode === mode}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:hidden grid grid-cols-3 gap-2 mb-3">
            {viewModeButtons.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 border-2 ${
                  viewMode === mode
                    ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-transparent"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                }`}
                aria-pressed={viewMode === mode}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {showMobileFilters && (
            <div className="lg:hidden mb-3 -mx-4 px-4 pt-3 border-t border-gray-100">
              <MobileFiltersPanel filters={filters} setFilters={setFilters} />
            </div>
          )}

          <ActiveFilters filters={filters} setFilters={setFilters} />
        </div>
      </div>

      {filteredUnits.length === 0 && localSearchQuery && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200 px-4 sm:px-6 py-3">
          <p className="text-sm text-gray-700">
            No units found for{" "}
            <span className="font-semibold text-orange-600">
              "{localSearchQuery}"
            </span>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </>
  );
}
