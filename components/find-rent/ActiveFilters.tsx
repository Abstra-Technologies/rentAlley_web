"use client";
import {
  X,
  MapPin,
  DollarSign,
  Home,
  Building2,
  Sofa,
  Maximize,
} from "lucide-react";
import { FilterState } from "@/types/types";

interface ActiveFiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export default function ActiveFilters({
  filters,
  setFilters,
}: ActiveFiltersProps) {
  const removeFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters };
    if (key === "minPrice" || key === "maxPrice" || key === "minSize") {
      newFilters[key] = 0;
    } else {
      newFilters[key] = "";
    }
    setFilters(newFilters);
  };

  const clearAllFilters = () => {
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
  };

  const formatFilterLabel = (key: string, value: string | number) => {
    switch (key) {
      case "propertyType":
        return value.toString().replace(/_/g, " ");
      case "furnishing":
        return value.toString().replace(/_/g, " ");
      case "minPrice":
        return `Min: ₱${Number(value).toLocaleString()}`;
      case "maxPrice":
        return `Max: ₱${Number(value).toLocaleString()}`;
      case "minSize":
        return `${value} sqm+`;
      case "location":
        return value.toString().replace(/_/g, " ");
      case "unitStyle":
        const style = value.toString();
        if (style.includes("-")) {
          return style
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
        return style.charAt(0).toUpperCase() + style.slice(1);
      default:
        return value.toString();
    }
  };

  const getFilterIcon = (key: string) => {
    const iconClass = "w-3.5 h-3.5 flex-shrink-0";
    switch (key) {
      case "location":
        return <MapPin className={iconClass} />;
      case "minPrice":
      case "maxPrice":
        return <DollarSign className={iconClass} />;
      case "unitStyle":
        return <Home className={iconClass} />;
      case "propertyType":
        return <Building2 className={iconClass} />;
      case "furnishing":
        return <Sofa className={iconClass} />;
      case "minSize":
        return <Maximize className={iconClass} />;
      default:
        return null;
    }
  };

  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (key === "searchQuery") return false;
    if (typeof value === "number") return value > 0;
    return value !== "" && value !== null && value !== undefined;
  });

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {activeFilters.map(([key, value]) => (
        <button
          key={key}
          type="button"
          onClick={() => removeFilter(key as keyof FilterState)}
          className="
            group inline-flex items-center gap-2 
            pl-3 pr-2 py-2
            bg-gradient-to-r from-blue-50 to-emerald-50 
            hover:from-blue-100 hover:to-emerald-100
            text-gray-700 
            rounded-full 
            border border-blue-200/60 hover:border-blue-300
            text-sm font-medium 
            transition-all duration-200 
            hover:shadow-md 
            active:scale-95
          "
        >
          <span className="text-emerald-600">{getFilterIcon(key)}</span>
          <span className="capitalize">{formatFilterLabel(key, value)}</span>
          <span className="w-5 h-5 rounded-full bg-gray-200/80 group-hover:bg-red-100 flex items-center justify-center transition-colors">
            <X className="w-3 h-3 text-gray-500 group-hover:text-red-500 transition-colors" />
          </span>
        </button>
      ))}

      {activeFilters.length > 1 && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="
            inline-flex items-center gap-1.5 
            px-3 py-2 
            text-sm font-medium 
            text-gray-500 hover:text-red-600
            hover:bg-red-50 
            rounded-full
            transition-all duration-200
          "
        >
          <X className="w-3.5 h-3.5" />
          Clear all
        </button>
      )}
    </div>
  );
}
