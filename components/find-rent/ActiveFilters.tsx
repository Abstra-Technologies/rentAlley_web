"use client";
import { X } from "lucide-react";
import { FilterState } from "@/types/types";
import {
  LOCATIONS,
  PROPERTY_TYPES,
  UNIT_STYLES,
  FURNISHING_OPTIONS,
  PESO,
} from "./utils";

interface ActiveFiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  onClearAll: () => void;
}

interface ActiveFilter {
  key: keyof FilterState;
  label: string;
  value: string | number;
}

export default function ActiveFilters({
  filters,
  setFilters,
  onClearAll,
}: ActiveFiltersProps) {
  // Build list of active filters
  const activeFilters: ActiveFilter[] = [];

  if (filters.location) {
    const loc = LOCATIONS.find((l) => l.value === filters.location);
    activeFilters.push({
      key: "location",
      label: loc?.label || filters.location,
      value: filters.location,
    });
  }

  if (filters.propertyType) {
    const type = PROPERTY_TYPES.find((t) => t.value === filters.propertyType);
    activeFilters.push({
      key: "propertyType",
      label: type?.label || filters.propertyType,
      value: filters.propertyType,
    });
  }

  if (filters.unitStyle) {
    const style = UNIT_STYLES.find((s) => s.value === filters.unitStyle);
    activeFilters.push({
      key: "unitStyle",
      label: style?.label || filters.unitStyle,
      value: filters.unitStyle,
    });
  }

  if (filters.furnishing) {
    const furn = FURNISHING_OPTIONS.find((f) => f.value === filters.furnishing);
    activeFilters.push({
      key: "furnishing",
      label: furn?.label || filters.furnishing,
      value: filters.furnishing,
    });
  }

  if (filters.minPrice > 0 || filters.maxPrice > 0) {
    let priceLabel = "";
    if (filters.minPrice > 0 && filters.maxPrice > 0) {
      priceLabel = `${PESO}${filters.minPrice.toLocaleString()} - ${PESO}${filters.maxPrice.toLocaleString()}`;
    } else if (filters.minPrice > 0) {
      priceLabel = `${PESO}${filters.minPrice.toLocaleString()}+`;
    } else if (filters.maxPrice > 0) {
      priceLabel = `Up to ${PESO}${filters.maxPrice.toLocaleString()}`;
    }
    activeFilters.push({
      key: "minPrice",
      label: priceLabel,
      value: filters.minPrice,
    });
  }

  if (filters.minSize > 0) {
    activeFilters.push({
      key: "minSize",
      label: `${filters.minSize}+ sqm`,
      value: filters.minSize,
    });
  }

  const removeFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters };
    if (key === "minPrice") {
      newFilters.minPrice = 0;
      newFilters.maxPrice = 0;
    } else if (typeof filters[key] === "number") {
      (newFilters as any)[key] = 0;
    } else {
      (newFilters as any)[key] = "";
    }
    setFilters(newFilters);
  };

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {activeFilters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={() => removeFilter(filter.key)}
          className="group flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium transition-all duration-200"
        >
          <span>{filter.label}</span>
          <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}

      {activeFilters.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="px-3 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full text-sm font-medium transition-all duration-200"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
