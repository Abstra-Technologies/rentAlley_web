import { FilterState } from "./types";

interface MobileFiltersPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}
export default function MobileFiltersPanel({
  filters,
  setFilters,
}: MobileFiltersPanelProps) {
  const propertyTypes = [
    { label: "All Types", value: "" },
    { label: "Apartment", value: "apartment" },
    { label: "Duplex", value: "duplex" },
    { label: "Condo", value: "condo" },
    { label: "House", value: "house" },
  ];

  const furnishingTypes = [
    { label: "All", value: "" },
    { label: "Fully Furnished", value: "fully_furnished" },
    { label: "Semi Furnished", value: "semi_furnished" },
    { label: "Unfurnished", value: "unfurnished" },
  ];

  return (
    <div className="lg:hidden mt-3 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-emerald-200">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {propertyTypes.map((type) => (
              <button
                key={type.value}
                onClick={() =>
                  setFilters((prev: FilterState) => ({
                    ...prev,
                    propertyType: type.value,
                  }))
                }
                className={`p-2 rounded-lg text-xs font-medium transition-all ${
                  filters.propertyType === type.value
                    ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-emerald-100"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Furnishing
          </label>
          <select
            value={filters.furnishing}
            onChange={(e) =>
              setFilters((prev: FilterState) => ({
                ...prev,
                furnishing: e.target.value,
              }))
            }
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
          >
            {furnishingTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ""}
              onChange={(e) =>
                setFilters((prev: FilterState) => ({
                  ...prev,
                  minPrice: Number(e.target.value),
                }))
              }
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ""}
              onChange={(e) =>
                setFilters((prev: FilterState) => ({
                  ...prev,
                  maxPrice: Number(e.target.value),
                }))
              }
              className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Size (sqm)
          </label>
          <input
            type="number"
            placeholder="0"
            value={filters.minSize || ""}
            onChange={(e) =>
              setFilters((prev: FilterState) => ({
                ...prev,
                minSize: Number(e.target.value),
              }))
            }
            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

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
          className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}
