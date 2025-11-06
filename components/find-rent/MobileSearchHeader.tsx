import { useState, useEffect, useCallback } from "react";
import { Search, X, MapPin, Grid3x3, Filter, Sparkles } from "lucide-react";
import { FilterState, Unit } from "../../types/types";
import { createPortal } from "react-dom";

interface MobileSearchHeaderProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
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
  const [localSearchQuery, setLocalSearchQuery] = useState(
    filters?.searchQuery || ""
  );
  const [showSearchFocus, setShowSearchFocus] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ ...filters, searchQuery: localSearchQuery });
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  useEffect(() => {
    setLocalSearchQuery(filters.searchQuery || "");
  }, [filters.searchQuery]);

  const handleSearchClear = useCallback(() => {
    setLocalSearchQuery("");
    setFilters({ ...filters, searchQuery: "" });
  }, [filters, setFilters]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.slice(0, 100);
      setLocalSearchQuery(value);
    },
    []
  );

  const handleCloseFilters = useCallback(() => {
    setShowMobileFilters(false);
  }, [setShowMobileFilters]);

  const viewModeButtons = [
    { mode: "grid", label: "Grid", icon: Grid3x3 },
    { mode: "map", label: "Map", icon: MapPin },
  ];

  return (
    <>
      {/* HEADER */}
      <div className="sticky top-[64px] z-40 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
          {/* Search bar and action buttons */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                  showSearchFocus ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                placeholder="Search by location, property name..."
                value={localSearchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchFocus(true)}
                onBlur={() => setShowSearchFocus(false)}
                className={`w-full pl-10 pr-10 py-2.5 lg:py-2 border rounded-lg text-sm transition-all ${
                  showSearchFocus
                    ? "border-blue-400 bg-white shadow-sm"
                    : "border-gray-300 bg-gray-50 hover:bg-white hover:border-gray-400"
                } focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400`}
              />
              {localSearchQuery && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700" />
                </button>
              )}
            </div>

            {/* Mobile View Mode Toggle */}
            <div className="flex lg:hidden gap-1 bg-gray-100 rounded-lg p-1">
              {viewModeButtons.map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === mode
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600"
                  }`}
                  aria-label={`${mode} view`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Mobile filter button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`lg:hidden p-2.5 rounded-lg border transition-all active:scale-95 ${
                showMobileFilters
                  ? "bg-gradient-to-r from-blue-500 to-emerald-500 border-transparent text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop info bar */}
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs text-gray-700">
                <span className="font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  {filteredUnits.length}
                </span>{" "}
                {filteredUnits.length === 1 ? "property" : "properties"}
              </span>
            </div>

            {/* Desktop View mode toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {viewModeButtons.map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    viewMode === mode
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters - Only show if there are active filters */}
          {Object.entries(filters).some(([key, value]) => {
            if (key === "searchQuery") return false;
            if (typeof value === "number") return value > 0;
            return value !== "";
          }) && (
            <div className="mt-3">
              <ActiveFilters filters={filters} setFilters={setFilters} />
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FILTER PORTAL */}
      {mounted &&
        showMobileFilters &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] lg:hidden"
            onClick={handleCloseFilters}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Filter panel */}
            <div
              className="absolute inset-x-0 bottom-0 top-[120px] bg-white rounded-t-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50 flex-shrink-0">
                <h2 className="text-base font-bold text-gray-900">Filters</h2>
                <button
                  type="button"
                  onClick={handleCloseFilters}
                  className="p-2 rounded-lg hover:bg-white/80 transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <MobileFiltersPanel
                filters={filters}
                setFilters={setFilters}
                onClose={handleCloseFilters}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
