"use client";
import { useState, useCallback } from "react";
import {
  MapPin,
  Building2,
  Bed,
  Banknote,
  Sofa,
  Ruler,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import { FilterState } from "@/types/types";
import {
  LOCATIONS,
  PROPERTY_TYPES,
  UNIT_STYLES,
  FURNISHING_OPTIONS,
  PRICE_RANGES,
  SIZE_PRESETS,
  PESO,
} from "./utils";

interface DesktopFiltersPanelProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export default function DesktopFiltersPanel({
  filters,
  setFilters,
}: DesktopFiltersPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    location: true,
    price: true,
    propertyType: true,
    unitStyle: false,
    furnishing: false,
    size: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters({ ...filters, [key]: value });
    },
    [filters, setFilters]
  );

  const toggleFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters({
        ...filters,
        [key]:
          filters[key] === value ? (typeof value === "number" ? 0 : "") : value,
      });
    },
    [filters, setFilters]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      searchQuery: filters.searchQuery,
      propertyType: "",
      furnishing: "",
      minPrice: 0,
      maxPrice: 0,
      minSize: 0,
      location: "",
      unitStyle: "",
    });
  }, [filters.searchQuery, setFilters]);

  const activeCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "searchQuery") return false;
    return typeof value === "number" ? value > 0 : value !== "";
  }).length;

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <SlidersHorizontal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Filters</h3>
              {activeCount > 0 && (
                <p className="text-sm text-slate-500">{activeCount} active</p>
              )}
            </div>
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-600 font-medium px-3 py-2 rounded-xl hover:bg-rose-50 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto px-6 py-4">
        {/* Location */}
        <FilterSection
          title="Location"
          icon={<MapPin className="w-5 h-5 text-emerald-600" />}
          isExpanded={expandedSections.location}
          onToggle={() => toggleSection("location")}
        >
          <div className="space-y-1.5">
            {LOCATIONS.filter((l) => l.popular).map((loc) => (
              <FilterButton
                key={loc.value}
                label={loc.label}
                isSelected={filters.location === loc.value}
                onClick={() => toggleFilter("location", loc.value)}
                badge="Popular"
              />
            ))}
            <details className="group">
              <summary className="flex items-center gap-1 px-3 py-2 text-sm text-emerald-600 font-semibold cursor-pointer list-none hover:bg-emerald-50 rounded-xl transition-colors">
                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                More locations
              </summary>
              <div className="mt-1.5 space-y-1.5">
                {LOCATIONS.filter((l) => !l.popular).map((loc) => (
                  <FilterButton
                    key={loc.value}
                    label={loc.label}
                    isSelected={filters.location === loc.value}
                    onClick={() => toggleFilter("location", loc.value)}
                  />
                ))}
              </div>
            </details>
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection
          title="Price Range"
          icon={<Banknote className="w-5 h-5 text-amber-600" />}
          isExpanded={expandedSections.price}
          onToggle={() => toggleSection("price")}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {PRICE_RANGES.map((range, idx) => (
                <FilterButton
                  key={idx}
                  label={range.label}
                  isSelected={
                    filters.minPrice === range.min &&
                    filters.maxPrice === range.max
                  }
                  onClick={() => {
                    if (
                      filters.minPrice === range.min &&
                      filters.maxPrice === range.max
                    ) {
                      updateFilter("minPrice", 0);
                      updateFilter("maxPrice", 0);
                    } else {
                      setFilters({
                        ...filters,
                        minPrice: range.min,
                        maxPrice: range.max,
                      });
                    }
                  }}
                  compact
                />
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                Custom Range
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                    {PESO}
                  </span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ""}
                    onChange={(e) =>
                      updateFilter("minPrice", Number(e.target.value) || 0)
                    }
                    className="w-full h-11 pl-8 pr-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-medium focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                    {PESO}
                  </span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ""}
                    onChange={(e) =>
                      updateFilter("maxPrice", Number(e.target.value) || 0)
                    }
                    className="w-full h-11 pl-8 pr-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-medium focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Property Type */}
        <FilterSection
          title="Property Type"
          icon={<Building2 className="w-5 h-5 text-blue-600" />}
          isExpanded={expandedSections.propertyType}
          onToggle={() => toggleSection("propertyType")}
        >
          <div className="grid grid-cols-2 gap-2">
            {PROPERTY_TYPES.map((type) => (
              <FilterButton
                key={type.value}
                label={type.label}
                isSelected={filters.propertyType === type.value}
                onClick={() => toggleFilter("propertyType", type.value)}
                compact
              />
            ))}
          </div>
        </FilterSection>

        {/* Unit Style */}
        <FilterSection
          title="Unit Style"
          icon={<Bed className="w-5 h-5 text-purple-600" />}
          isExpanded={expandedSections.unitStyle}
          onToggle={() => toggleSection("unitStyle")}
        >
          <div className="grid grid-cols-2 gap-2">
            {UNIT_STYLES.map((style) => (
              <FilterButton
                key={style.value}
                label={style.label}
                isSelected={filters.unitStyle === style.value}
                onClick={() => toggleFilter("unitStyle", style.value)}
                compact
              />
            ))}
          </div>
        </FilterSection>

        {/* Furnishing */}
        <FilterSection
          title="Furnishing"
          icon={<Sofa className="w-5 h-5 text-teal-600" />}
          isExpanded={expandedSections.furnishing}
          onToggle={() => toggleSection("furnishing")}
        >
          <div className="space-y-1.5">
            {FURNISHING_OPTIONS.map((opt) => (
              <FilterButton
                key={opt.value}
                label={opt.label}
                isSelected={filters.furnishing === opt.value}
                onClick={() => toggleFilter("furnishing", opt.value)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Minimum Size */}
        <FilterSection
          title="Minimum Size"
          icon={<Ruler className="w-5 h-5 text-indigo-600" />}
          isExpanded={expandedSections.size}
          onToggle={() => toggleSection("size")}
        >
          <div className="flex flex-wrap gap-2">
            {SIZE_PRESETS.map((size) => (
              <FilterButton
                key={size}
                label={`${size}+ sqm`}
                isSelected={filters.minSize === size}
                onClick={() => toggleFilter("minSize", size)}
                compact
              />
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 hover:bg-slate-50/50 transition-colors rounded-xl -mx-2 px-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
            {icon}
          </div>
          <span className="font-semibold text-slate-900">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? "max-h-[600px] opacity-100 pb-4" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function FilterButton({
  label,
  isSelected,
  onClick,
  badge,
  compact = false,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  badge?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-full text-left font-medium text-sm rounded-xl transition-all duration-200 active:scale-[0.98]
        ${compact ? "px-3 py-2.5" : "px-4 py-3"}
        ${
          isSelected
            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20"
            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300"
        }
      `}
    >
      {label}
      {badge && !isSelected && (
        <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}
