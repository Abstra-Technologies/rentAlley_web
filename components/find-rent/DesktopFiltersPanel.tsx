"use client";
import { FilterState } from "../../types/types";
import {
  MapPin,
  DollarSign,
  Home,
  Building2,
  Sofa,
  Maximize,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface DesktopFiltersPanelProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

export default function DesktopFiltersPanel({
  filters,
  setFilters,
}: DesktopFiltersPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    location: true,
    propertyType: true,
    unitStyle: true,
    furnishing: false,
    size: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const propertyTypes = [
    { label: "Apartment", value: "apartment", icon: "🏢" },
    { label: "Condo", value: "condo", icon: "🏘️" },
    { label: "House", value: "house", icon: "🏠" },
    { label: "Duplex", value: "duplex", icon: "🏚️" },
    { label: "Dormitory", value: "dormitory", icon: "🏫" },
  ];

  const furnishingTypes = [
    { label: "Fully Furnished", value: "fully_furnished" },
    { label: "Semi Furnished", value: "semi_furnished" },
    { label: "Unfurnished", value: "unfurnished" },
  ];

  const locations = [
    { label: "Metro Manila", value: "Metro Manila", popular: true },
    { label: "Cebu", value: "Cebu", popular: true },
    { label: "Davao", value: "Davao", popular: true },
    { label: "Ilocos", value: "Ilocos" },
    { label: "Cagayan Valley", value: "Cagayan_Valley" },
    { label: "Central Luzon", value: "Central_Luzon" },
    { label: "Calabarzon", value: "Calabarzon" },
    { label: "Mimaropa", value: "Mimaropa" },
    { label: "Bicol", value: "Bicol" },
    { label: "Western Visayas", value: "Western_Visayas" },
    { label: "Central Visayas", value: "Central_Visayas" },
    { label: "Eastern Visayas", value: "Eastern_Visayas" },
    { label: "Zamboanga Peninsula", value: "Zamboanga_Peninsula" },
    { label: "Northern Mindanao", value: "Northern_Mindanao" },
    { label: "Davao Region", value: "Davao_Region" },
    { label: "Soccsksargen", value: "Soccsksargen" },
    { label: "Caraga", value: "Caraga" },
    { label: "Bangsamoro", value: "Bangsamoro" },
  ];

  const unitStyles = [
    { label: "Studio", value: "studio", icon: "🛏️" },
    { label: "1 Bedroom", value: "1-bedroom", icon: "🚪" },
    { label: "2 Bedroom", value: "2-bedroom", icon: "🚪🚪" },
    { label: "3 Bedroom", value: "3-bedroom", icon: "🏡" },
    { label: "Loft", value: "loft", icon: "🪜" },
    { label: "Duplex", value: "duplex", icon: "🏚️" },
    { label: "Penthouse", value: "penthouse", icon: "🌆" },
    { label: "Dorm", value: "dorm", icon: "🛌" },
  ];

  const priceRanges = [
    { label: "Under ₱5k", min: 0, max: 5000 },
    { label: "₱5k - ₱10k", min: 5000, max: 10000 },
    { label: "₱10k - ₱15k", min: 10000, max: 15000 },
    { label: "₱15k - ₱20k", min: 15000, max: 20000 },
    { label: "Above ₱20k", min: 20000, max: 0 },
  ];

  const handleQuickPrice = (min: number, max: number) => {
    setFilters({ ...filters, minPrice: min, maxPrice: max });
  };

  const handleClearFilters = () => {
    setFilters({
      searchQuery: filters.searchQuery || "",
      propertyType: "",
      furnishing: "",
      minPrice: 0,
      maxPrice: 0,
      minSize: 0,
      location: "",
      unitStyle: "",
    });
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "searchQuery") return false;
    if (typeof value === "number") return value > 0;
    return value !== "";
  }).length;

  const FilterSection = ({
    title,
    icon: Icon,
    isExpanded,
    onToggle,
    children,
  }: {
    title: string;
    icon: any;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-1 hover:bg-gray-50/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isExpanded && <div className="pb-4 px-1">{children}</div>}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-[180px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-5 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <p className="text-xs text-gray-600 mt-0.5">
                {activeFilterCount}{" "}
                {activeFilterCount === 1 ? "filter" : "filters"} applied
              </p>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-white/60 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Filters */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto px-5">
        {/* Price Range Section */}
        <FilterSection
          title="Price Range"
          icon={DollarSign}
          isExpanded={expandedSections.price}
          onToggle={() => toggleSection("price")}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {priceRanges.map((range) => (
                <button
                  key={range.label}
                  type="button"
                  onClick={() => handleQuickPrice(range.min, range.max)}
                  className={`px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                    filters.minPrice === range.min &&
                    filters.maxPrice === range.max
                      ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-600 mb-2 font-medium">
                Custom Range
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, minPrice: Number(e.target.value) })
                  }
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, maxPrice: Number(e.target.value) })
                  }
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Location Section */}
        <FilterSection
          title="Location"
          icon={MapPin}
          isExpanded={expandedSections.location}
          onToggle={() => toggleSection("location")}
        >
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setFilters({ ...filters, location: "" })}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                !filters.location
                  ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              All Locations
            </button>
            {locations
              .filter((loc) => loc.popular)
              .map((loc) => (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() =>
                    setFilters({ ...filters, location: loc.value })
                  }
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.location === loc.value
                      ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            <details className="group">
              <summary className="px-3 py-2 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer list-none">
                Show more locations
              </summary>
              <div className="mt-2 space-y-2">
                {locations
                  .filter((loc) => !loc.popular)
                  .map((loc) => (
                    <button
                      key={loc.value}
                      type="button"
                      onClick={() =>
                        setFilters({ ...filters, location: loc.value })
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.location === loc.value
                          ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
              </div>
            </details>
          </div>
        </FilterSection>

        {/* Property Type Section */}
        <FilterSection
          title="Property Type"
          icon={Building2}
          isExpanded={expandedSections.propertyType}
          onToggle={() => toggleSection("propertyType")}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFilters({ ...filters, propertyType: "" })}
              className={`p-3 rounded-lg text-xs font-semibold transition-all ${
                !filters.propertyType
                  ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              All Types
            </button>
            {propertyTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  setFilters({ ...filters, propertyType: type.value })
                }
                className={`p-3 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                  filters.propertyType === type.value
                    ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <span className="text-base">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Unit Style Section */}
        <FilterSection
          title="Unit Style"
          icon={Home}
          isExpanded={expandedSections.unitStyle}
          onToggle={() => toggleSection("unitStyle")}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFilters({ ...filters, unitStyle: "" })}
              className={`p-3 rounded-lg text-xs font-semibold transition-all ${
                !filters.unitStyle
                  ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              All Styles
            </button>
            {unitStyles.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() =>
                  setFilters({ ...filters, unitStyle: style.value })
                }
                className={`p-3 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                  filters.unitStyle === style.value
                    ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <span className="text-base">{style.icon}</span>
                {style.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Furnishing Section */}
        <FilterSection
          title="Furnishing"
          icon={Sofa}
          isExpanded={expandedSections.furnishing}
          onToggle={() => toggleSection("furnishing")}
        >
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setFilters({ ...filters, furnishing: "" })}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !filters.furnishing
                  ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              All
            </button>
            {furnishingTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() =>
                  setFilters({ ...filters, furnishing: type.value })
                }
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  filters.furnishing === type.value
                    ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Minimum Size Section */}
        <FilterSection
          title="Minimum Size"
          icon={Maximize}
          isExpanded={expandedSections.size}
          onToggle={() => toggleSection("size")}
        >
          <input
            type="number"
            placeholder="Enter minimum size (sqm)"
            value={filters.minSize || ""}
            onChange={(e) =>
              setFilters({ ...filters, minSize: Number(e.target.value) })
            }
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
          />
        </FilterSection>
      </div>
    </div>
  );
}
