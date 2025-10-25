import { useState, useEffect, useCallback } from "react";
import {
  Search,
  X,
  MapPin,
  List,
  Grid3x3,
  Filter,
  Sparkles,
} from "lucide-react";
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
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          {/* Mobile Search Bar */}
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <div className="flex-1 relative group">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search
                    className={`w-5 h-5 transition-colors duration-200 ${
                      showSearchFocus ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Search by location, property name..."
                  value={localSearchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSearchFocus(true)}
                  onBlur={() => setShowSearchFocus(false)}
                  className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl sm:rounded-2xl text-sm font-medium transition-all duration-200 ${
                    showSearchFocus
                      ? "border-blue-500 bg-white shadow-lg shadow-blue-100"
                      : "border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300"
                  } focus:outline-none focus:bg-white placeholder:text-gray-400`}
                />
                {localSearchQuery && (
                  <button
                    onClick={handleSearchClear}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                  </button>
                )}
              </div>
              {/* Search Focus Ring */}
              {showSearchFocus && (
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-blue-500/5 -z-10 animate-pulse" />
              )}
            </div>

            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`lg:hidden p-3.5 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                showMobileFilters
                  ? "bg-gradient-to-r from-blue-500 to-emerald-500 border-transparent text-white shadow-lg shadow-blue-500/30"
                  : "bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
              aria-label="Toggle filters"
              aria-pressed={showMobileFilters}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop: Results Count + View Mode */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                    {filteredUnits.length}
                  </span>
                  <span className="ml-1.5 text-gray-600">
                    {filteredUnits.length === 1 ? "property" : "properties"}{" "}
                    available
                  </span>
                </span>
              </div>
            </div>

            <div className="flex gap-2 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-1.5 border border-blue-100">
              {viewModeButtons.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    viewMode === mode
                      ? "bg-white text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
                  aria-pressed={viewMode === mode}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile: View Mode Buttons */}
          <div className="lg:hidden grid grid-cols-3 gap-2 mb-4">
            {viewModeButtons.map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 border-2 ${
                  viewMode === mode
                    ? "bg-gradient-to-r from-blue-500 via-blue-600 to-emerald-600 border-transparent text-white shadow-lg shadow-blue-500/30"
                    : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
                aria-pressed={viewMode === mode}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Mobile Results Count */}
          <div className="lg:hidden mb-4">
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                  {filteredUnits.length}
                </span>
                <span className="ml-1.5 text-gray-600">
                  {filteredUnits.length === 1 ? "property" : "properties"} found
                </span>
              </span>
            </div>
          </div>

          {/* Mobile Filters Panel */}
          {showMobileFilters && (
            <div className="lg:hidden mb-4 -mx-4 px-4 py-4 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
              <MobileFiltersPanel filters={filters} setFilters={setFilters} />
            </div>
          )}

          {/* Active Filters */}
          <ActiveFilters filters={filters} setFilters={setFilters} />
        </div>
      </div>

      {/* No Results Banner */}
      {filteredUnits.length === 0 && localSearchQuery && (
        <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 border-b border-orange-200 px-4 sm:px-6 py-4">
          <div className="flex items-start gap-3 max-w-3xl">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
              <Search className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                No results for{" "}
                <span className="text-orange-600">"{localSearchQuery}"</span>
              </p>
              <p className="text-xs text-gray-600">
                Try adjusting your search terms or filters to find what you're
                looking for
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
