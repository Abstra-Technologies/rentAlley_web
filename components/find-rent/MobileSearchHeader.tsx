"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, MapPin, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { FilterState, Unit } from "../../types/types";
import { createPortal } from "react-dom";

interface MobileSearchHeaderProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  viewMode: "grid" | "map";
  setViewMode: (mode: "grid" | "map") => void;
  filteredUnits: Unit[];
  showMobileFilters: boolean;
  setShowMobileFilters: (show: boolean) => void;
  activeFilterCount: number;
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
  activeFilterCount,
  MobileFiltersPanel,
  ActiveFilters,
}: MobileSearchHeaderProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(
    filters?.searchQuery || ""
  );
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Swipe-to-close state
  const [touchStart, setTouchStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== filters.searchQuery) {
        setFilters({ ...filters, searchQuery: localSearchQuery });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  // Sync local state with URL params
  useEffect(() => {
    setLocalSearchQuery(filters.searchQuery || "");
  }, [filters.searchQuery]);

  // Prevent body scroll when filter panel is open
  useEffect(() => {
    if (showMobileFilters) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileFilters]);

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
    setDragOffset(0);
    setIsDragging(false);
  }, [setShowMobileFilters]);

  // Touch handlers for swipe-to-close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientY - touchStart;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragOffset > 120) {
      handleCloseFilters();
    } else {
      setDragOffset(0);
    }
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <>
      {/* Header Container */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-sm">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          {/* Main Search Row */}
          <div className="flex items-center gap-3 py-3 lg:py-4">
            {/* Search Input */}
            <div className="flex-1 relative group">
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  isSearchFocused ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder="Search location, property..."
                value={localSearchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`
                  w-full h-11 lg:h-12 pl-11 pr-10 
                  bg-gray-50 border-2 rounded-xl
                  text-sm text-gray-900 placeholder:text-gray-400
                  transition-all duration-200 ease-out
                  ${
                    isSearchFocused
                      ? "border-emerald-500 bg-white shadow-lg shadow-emerald-500/10 ring-4 ring-emerald-500/5"
                      : "border-transparent hover:border-gray-200 hover:bg-gray-100/80"
                  }
                  focus:outline-none
                `}
              />
              {localSearchQuery && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3 text-gray-600" strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* View Mode Toggle - Pill Style */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    viewMode === "grid"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden lg:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${
                    viewMode === "map"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden lg:inline">Map</span>
              </button>
            </div>

            {/* Mobile View Toggle */}
            <div className="flex sm:hidden items-center gap-1 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === "map"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
                aria-label="Map view"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`
                lg:hidden relative flex items-center justify-center
                h-11 px-4 rounded-xl border-2
                font-medium text-sm
                transition-all duration-200 active:scale-95
                ${
                  showMobileFilters || hasActiveFilters
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 border-transparent text-white shadow-lg shadow-emerald-600/25"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md"
                }
              `}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-white/20 rounded-full text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Info Bar */}
          <div className="hidden lg:flex items-center justify-between gap-4 pb-4">
            <div className="flex items-center gap-3">
              {/* Results Count */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-full border border-emerald-100/60">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse" />
                <span className="text-sm text-gray-700">
                  <span className="font-bold text-gray-900">
                    {filteredUnits.length}
                  </span>{" "}
                  {filteredUnits.length === 1 ? "property" : "properties"}{" "}
                  available
                </span>
              </div>
            </div>
          </div>

          {/* Active Filters Row */}
          {hasActiveFilters && (
            <div className="pb-3 lg:pb-4 -mt-1">
              <ActiveFilters filters={filters} setFilters={setFilters} />
            </div>
          )}
        </div>
      </header>

      {/* Mobile Filter Panel Portal */}
      {mounted &&
        showMobileFilters &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] lg:hidden"
            onClick={handleCloseFilters}
          >
            {/* Backdrop with blur */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
              style={{ opacity: isDragging ? 1 - dragOffset / 300 : 1 }}
            />

            {/* Filter Panel */}
            <div
              ref={filterPanelRef}
              className="absolute inset-x-0 bottom-0 bg-white rounded-t-[28px] shadow-2xl flex flex-col"
              style={{
                maxHeight: "85vh",
                transform: `translateY(${dragOffset}px)`,
                transition: isDragging
                  ? "none"
                  : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    isDragging ? "w-16 bg-emerald-400" : "w-10 bg-gray-300"
                  }`}
                />
              </div>

              {/* Panel Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Refine your search results
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseFilters}
                  className="p-2.5 -mr-2 rounded-xl hover:bg-gray-100 transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <MobileFiltersPanel
                  filters={filters}
                  setFilters={setFilters}
                  onClose={handleCloseFilters}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
