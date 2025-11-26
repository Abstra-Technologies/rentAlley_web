"use client";
import { FilterState } from "../../types/types";
import {
  MapPin,
  DollarSign,
  Home,
  Building2,
  Sofa,
  Maximize,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
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
    icon: React.ElementType;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-1 hover:bg-gray-50/50 transition-colors rounded-lg -mx-1"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isExpanded ? "max-h-[800px] opacity-100 pb-4" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-1">{children}</div>
      </div>
    </div>
  );

  const SelectableButton = ({
    isSelected,
    onClick,
    children,
    className = "",
  }: {
    isSelected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`
        transition-all duration-200 font-medium text-sm
        ${
          isSelected
            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md shadow-emerald-600/20"
            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50/80 to-emerald-50/80 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <SlidersHorizontal className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Filters</h3>
              {activeFilterCount > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeFilterCount}{" "}
                  {activeFilterCount === 1 ? "filter" : "filters"} applied
                </p>
              )}
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Filters */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto px-5 py-2">
        {/* Price Range */}
        <FilterSection
          title="Price Range"
          icon={DollarSign}
          isExpanded={expandedSections.price}
          onToggle={() => toggleSection("price")}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {priceRanges.map((range) => (
                <SelectableButton
                  key={range.label}
                  isSelected={
                    filters.minPrice === range.min &&
                    filters.maxPrice === range.max
                  }
                  onClick={() => handleQuickPrice(range.min, range.max)}
                  className="px-3 py-2.5 rounded-xl text-xs"
                >
                  {range.label}
                </SelectableButton>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2 font-medium">
                Custom Range
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    ₱
                  </span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minPrice: Number(e.target.value),
                      })
                    }
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    ₱
                  </span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        maxPrice: Number(e.target.value),
                      })
                    }
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Location */}
        <FilterSection
          title="Location"
          icon={MapPin}
          isExpanded={expandedSections.location}
          onToggle={() => toggleSection("location")}
        >
          <div className="space-y-1.5">
            <SelectableButton
              isSelected={!filters.location}
              onClick={() => setFilters({ ...filters, location: "" })}
              className="w-full text-left px-3 py-2.5 rounded-xl"
            >
              All Locations
            </SelectableButton>

            {/* Popular locations */}
            {locations
              .filter((loc) => loc.popular)
              .map((loc) => (
                <SelectableButton
                  key={loc.value}
                  isSelected={filters.location === loc.value}
                  onClick={() =>
                    setFilters({ ...filters, location: loc.value })
                  }
                  className="w-full text-left px-3 py-2.5 rounded-xl"
                >
                  <span className="flex items-center gap-2">
                    {loc.label}
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                      Popular
                    </span>
                  </span>
                </SelectableButton>
              ))}

            {/* Other locations in details */}
            <details className="group mt-2">
              <summary className="px-3 py-2 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer list-none flex items-center gap-1">
                <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                Show more locations
              </summary>
              <div className="mt-2 space-y-1.5">
                {locations
                  .filter((loc) => !loc.popular)
                  .map((loc) => (
                    <SelectableButton
                      key={loc.value}
                      isSelected={filters.location === loc.value}
                      onClick={() =>
                        setFilters({ ...filters, location: loc.value })
                      }
                      className="w-full text-left px-3 py-2.5 rounded-xl"
                    >
                      {loc.label}
                    </SelectableButton>
                  ))}
              </div>
            </details>
          </div>
        </FilterSection>

        {/* Property Type */}
        <FilterSection
          title="Property Type"
          icon={Building2}
          isExpanded={expandedSections.propertyType}
          onToggle={() => toggleSection("propertyType")}
        >
          <div className="grid grid-cols-2 gap-2">
            <SelectableButton
              isSelected={!filters.propertyType}
              onClick={() => setFilters({ ...filters, propertyType: "" })}
              className="p-3 rounded-xl text-xs"
            >
              All Types
            </SelectableButton>
            {propertyTypes.map((type) => (
              <SelectableButton
                key={type.value}
                isSelected={filters.propertyType === type.value}
                onClick={() =>
                  setFilters({ ...filters, propertyType: type.value })
                }
                className="p-3 rounded-xl text-xs flex flex-col items-center gap-1.5"
              >
                <span className="text-lg">{type.icon}</span>
                {type.label}
              </SelectableButton>
            ))}
          </div>
        </FilterSection>

        {/* Unit Style */}
        <FilterSection
          title="Unit Style"
          icon={Home}
          isExpanded={expandedSections.unitStyle}
          onToggle={() => toggleSection("unitStyle")}
        >
          <div className="grid grid-cols-2 gap-2">
            <SelectableButton
              isSelected={!filters.unitStyle}
              onClick={() => setFilters({ ...filters, unitStyle: "" })}
              className="p-3 rounded-xl text-xs"
            >
              All Styles
            </SelectableButton>
            {unitStyles.map((style) => (
              <SelectableButton
                key={style.value}
                isSelected={filters.unitStyle === style.value}
                onClick={() =>
                  setFilters({ ...filters, unitStyle: style.value })
                }
                className="p-3 rounded-xl text-xs flex flex-col items-center gap-1.5"
              >
                <span className="text-lg">{style.icon}</span>
                {style.label}
              </SelectableButton>
            ))}
          </div>
        </FilterSection>

        {/* Furnishing */}
        <FilterSection
          title="Furnishing"
          icon={Sofa}
          isExpanded={expandedSections.furnishing}
          onToggle={() => toggleSection("furnishing")}
        >
          <div className="space-y-1.5">
            <SelectableButton
              isSelected={!filters.furnishing}
              onClick={() => setFilters({ ...filters, furnishing: "" })}
              className="w-full text-left px-3 py-2.5 rounded-xl"
            >
              All
            </SelectableButton>
            {furnishingTypes.map((type) => (
              <SelectableButton
                key={type.value}
                isSelected={filters.furnishing === type.value}
                onClick={() =>
                  setFilters({ ...filters, furnishing: type.value })
                }
                className="w-full text-left px-3 py-2.5 rounded-xl"
              >
                {type.label}
              </SelectableButton>
            ))}
          </div>
        </FilterSection>

        {/* Minimum Size */}
        <FilterSection
          title="Minimum Size"
          icon={Maximize}
          isExpanded={expandedSections.size}
          onToggle={() => toggleSection("size")}
        >
          <div className="relative">
            <input
              type="number"
              placeholder="Enter minimum size"
              value={filters.minSize || ""}
              onChange={(e) =>
                setFilters({ ...filters, minSize: Number(e.target.value) })
              }
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">
              sqm
            </span>
          </div>
        </FilterSection>
      </div>
    </div>
  );
}
