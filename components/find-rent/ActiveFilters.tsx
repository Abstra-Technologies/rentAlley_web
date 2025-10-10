import { FaTimes } from "react-icons/fa";
import { FilterState } from "./types";
import { formatCurrency } from "./utils";

interface ActiveFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export default function ActiveFilters({
  filters,
  setFilters,
}: ActiveFiltersProps) {
  const activeFilters = [];

  if (filters.searchQuery)
    activeFilters.push({ type: "search", value: filters.searchQuery });
  if (filters.propertyType)
    activeFilters.push({ type: "propertyType", value: filters.propertyType });
  if (filters.furnishing)
    activeFilters.push({ type: "furnishing", value: filters.furnishing });
  if (filters.minPrice > 0)
    activeFilters.push({
      type: "minPrice",
      value: `Min: ${formatCurrency(filters.minPrice)}`,
    });
  if (filters.maxPrice > 0)
    activeFilters.push({
      type: "maxPrice",
      value: `Max: ${formatCurrency(filters.maxPrice)}`,
    });
  if (filters.minSize > 0)
    activeFilters.push({ type: "minSize", value: `${filters.minSize}+ sqm` });

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {activeFilters.map((filter, idx) => (
        <span
          key={idx}
          className="inline-flex items-center bg-gradient-to-r from-blue-100 to-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs"
        >
          {filter.value}
          <button
            onClick={() =>
              setFilters((prev: FilterState) => ({
                ...prev,
                [filter.type]:
                  filter.type.includes("Price") || filter.type === "minSize"
                    ? 0
                    : "",
              }))
            }
            className="ml-2 text-emerald-600 hover:text-emerald-800"
          >
            <FaTimes className="text-xs" />
          </button>
        </span>
      ))}
      <button
        onClick={() =>
          setFilters({
            searchQuery: "",
            propertyType: "",
            furnishing: "",
            minPrice: 0,
            maxPrice: 0,
            minSize: 0,
            bedSpacing: "",
          })
        }
        className="text-xs text-red-600 hover:text-red-800 font-medium"
      >
        Clear All
      </button>
    </div>
  );
}
