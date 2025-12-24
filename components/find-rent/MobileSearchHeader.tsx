"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  X,
  MapPin,
  LayoutGrid,
  Map,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { FilterState } from "@/types/types";
import { LOCATIONS } from "./utils";

interface MobileSearchHeaderProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  viewMode: "grid" | "map" | "split";
  setViewMode: (mode: "grid" | "map" | "split") => void;
  totalResults: number;
  activeFilterCount: number;
  onOpenFilters: () => void;
}

export default function MobileSearchHeader({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  totalResults,
  activeFilterCount,
  onOpenFilters,
}: MobileSearchHeaderProps) {
  const [localSearch, setLocalSearch] = useState(filters.searchQuery || "");
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.searchQuery) {
        setFilters({ ...filters, searchQuery: localSearch });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, filters, setFilters]);

  // Sync with URL params
  useEffect(() => {
    setLocalSearch(filters.searchQuery || "");
  }, [filters.searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = useCallback(() => {
    setLocalSearch("");
    setFilters({ ...filters, searchQuery: "" });
    inputRef.current?.focus();
  }, [filters, setFilters]);

  const handleSuggestionClick = useCallback(
    (location: string) => {
      setLocalSearch(location);
      setFilters({ ...filters, searchQuery: location });
      setShowSuggestions(false);
    },
    [filters, setFilters]
  );

  const suggestions = LOCATIONS.filter(
    (loc) =>
      localSearch.length > 0 &&
      loc.label.toLowerCase().includes(localSearch.toLowerCase())
  ).slice(0, 5);

  const popularLocations = LOCATIONS.filter((loc) => loc.popular);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm shadow-slate-200/50">
      <div className="max-w-[1800px] mx-auto">
        {/* Main Header Row */}
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6 lg:py-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div
              className={`
                relative flex items-center bg-slate-50 rounded-2xl
                border-2 transition-all duration-300
                ${
                  isFocused
                    ? "border-emerald-500 bg-white shadow-lg shadow-emerald-500/10 ring-4 ring-emerald-500/5"
                    : "border-transparent hover:border-slate-200"
                }
              `}
            >
              <div className="absolute left-4 pointer-events-none">
                <Search
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isFocused ? "text-emerald-600" : "text-slate-400"
                  }`}
                />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onFocus={() => {
                  setIsFocused(true);
                  setShowSuggestions(true);
                }}
                onBlur={() => setIsFocused(false)}
                placeholder="Search by location, property name..."
                className="w-full h-12 lg:h-14 pl-12 pr-12 bg-transparent text-slate-900 placeholder-slate-400 text-base lg:text-lg font-medium focus:outline-none"
                maxLength={100}
              />

              {localSearch && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 active:scale-90 transition-all duration-150"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && isFocused && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 animate-fade-in-down"
              >
                {suggestions.length > 0 ? (
                  <div className="p-2">
                    {suggestions.map((loc) => (
                      <button
                        key={loc.value}
                        type="button"
                        onMouseDown={() => handleSuggestionClick(loc.label)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <MapPin className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {loc.label}
                          </p>
                          <p className="text-sm text-slate-500">Philippines</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : localSearch.length === 0 ? (
                  <div className="p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Popular Locations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {popularLocations.map((loc) => (
                        <button
                          key={loc.value}
                          type="button"
                          onMouseDown={() => handleSuggestionClick(loc.label)}
                          className="px-4 py-2 rounded-full bg-gradient-to-r from-slate-50 to-slate-100 hover:from-emerald-50 hover:to-teal-50 text-sm font-medium text-slate-700 hover:text-emerald-700 transition-all duration-200 border border-slate-200 hover:border-emerald-200"
                        >
                          {loc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm">
                      No locations found for "{localSearch}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* View Mode Toggle - Desktop */}
          <div className="hidden lg:flex items-center gap-1 p-1.5 bg-slate-100 rounded-2xl">
            {[
              { mode: "grid" as const, icon: LayoutGrid, label: "Grid" },
              { mode: "split" as const, icon: Map, label: "Split" },
              { mode: "map" as const, icon: MapPin, label: "Map" },
            ].map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                  transition-all duration-300
                  ${
                    viewMode === mode
                      ? "bg-white text-slate-900 shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Mobile View Toggle */}
          <div className="flex lg:hidden items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-2.5 rounded-lg transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`p-2.5 rounded-lg transition-all duration-200 ${
                viewMode === "map"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <MapPin className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Button */}
          <button
            type="button"
            onClick={onOpenFilters}
            className={`
              relative flex items-center justify-center gap-2
              h-12 lg:h-14 px-4 lg:px-5 rounded-2xl
              font-semibold text-sm lg:text-base
              transition-all duration-300 active:scale-95
              ${
                activeFilterCount > 0
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/25"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }
            `}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 bg-white/20 rounded-full text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Results Bar */}
        <div className="flex items-center justify-between gap-4 px-4 pb-3 lg:px-6 lg:pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-full border border-emerald-100">
              <div className="relative flex items-center justify-center w-2 h-2">
                <span className="absolute w-full h-full rounded-full bg-emerald-500 animate-ping opacity-75" />
                <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                <span className="text-emerald-700 tabular-nums">
                  {totalResults}
                </span>{" "}
                units available
              </span>
            </div>
          </div>

          {/* Quick Filter Pills - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {LOCATIONS.filter((l) => l.popular)
              .slice(0, 3)
              .map((loc) => (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      location: filters.location === loc.value ? "" : loc.value,
                    })
                  }
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium
                    transition-all duration-200
                    ${
                      filters.location === loc.value
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }
                  `}
                >
                  {loc.label}
                </button>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
}
