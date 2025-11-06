import { X, MapPin, DollarSign, Home } from "lucide-react";
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

  const formatFilterLabel = (key: string, value: string | number) => {
    switch (key) {
      case "propertyType":
        return `Type: ${value.toString().replace(/_/g, " ")}`;
      case "furnishing":
        return `Furnishing: ${value.toString().replace(/_/g, " ")}`;
      case "minPrice":
        return `Min: ₱${Number(value).toLocaleString()}`;
      case "maxPrice":
        return `Max: ₱${Number(value).toLocaleString()}`;
      case "minSize":
        return `Min Size: ${value} sqm`;
      case "location":
        return `${value.toString().replace(/_/g, " ")}`;
      case "unitStyle":
        const style = value.toString();
        if (style.includes("-")) {
          return `Style: ${style
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}`;
        }
        return `Style: ${style.charAt(0).toUpperCase() + style.slice(1)}`;
      default:
        return value.toString();
    }
  };

  const getFilterIcon = (key: string) => {
    switch (key) {
      case "location":
        return <MapPin className="w-3.5 h-3.5" />;
      case "minPrice":
      case "maxPrice":
        return <DollarSign className="w-3.5 h-3.5" />;
      case "unitStyle":
        return <Home className="w-3.5 h-3.5" />;
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
    <div className="flex flex-wrap gap-2">
      {activeFilters.map(([key, value]) => (
        <button
          key={key}
          type="button"
          onClick={() => removeFilter(key as keyof FilterState)}
          className="group inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-emerald-50 hover:from-blue-100 hover:to-emerald-100 text-gray-700 rounded-lg border border-blue-200 hover:border-blue-300 text-sm font-medium transition-all duration-200 hover:shadow-md active:scale-95"
        >
          {getFilterIcon(key)}
          <span className="capitalize">{formatFilterLabel(key, value)}</span>
          <X className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
        </button>
      ))}
    </div>
  );
}
