"use client";
import { FilterState } from "../../types/types";
import { MapPin, DollarSign, Home, X, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface MobileFiltersPanelProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  onClose?: () => void;
}

export default function MobileFiltersPanel({
  filters,
  setFilters,
  onClose,
}: MobileFiltersPanelProps) {
  const [activeStep, setActiveStep] = useState<
    "main" | "price" | "location" | "propertyType" | "unitStyle"
  >("main");

  const propertyTypes = [
    { label: "Apartment", value: "apartment", icon: "🏢" },
    { label: "Condo", value: "condo", icon: "🏘️" },
    { label: "House", value: "house", icon: "🏠" },
    { label: "Duplex", value: "duplex", icon: "🏚️" },
    { label: "Dormitory", value: "dormitory", icon: "🏫" },
  ];

  const furnishingTypes = [
    { label: "All", value: "" },
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
    { label: "Others", value: "others", icon: "🏘️" },
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

  const getFilterValue = (key: string) => {
    const value = filters[key as keyof FilterState];
    if (key === "location" && value) {
      return locations.find((l) => l.value === value)?.label || "";
    }
    if (key === "propertyType" && value) {
      return propertyTypes.find((p) => p.value === value)?.label || "";
    }
    if (key === "unitStyle" && value) {
      return unitStyles.find((u) => u.value === value)?.label || "";
    }
    if (key === "price") {
      if (filters.minPrice && filters.maxPrice) {
        return `₱${filters.minPrice.toLocaleString()} - ₱${filters.maxPrice.toLocaleString()}`;
      }
      if (filters.minPrice) return `From ₱${filters.minPrice.toLocaleString()}`;
      if (filters.maxPrice)
        return `Up to ₱${filters.maxPrice.toLocaleString()}`;
      return "";
    }
    return value;
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Main filter menu
  const MainMenu = () => (
    <div className="space-y-2 pb-20">
      {/* Price Range */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActiveStep("price");
        }}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Price Range</p>
            <p className="text-xs text-gray-500">
              {getFilterValue("price") || "Any price"}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Location */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActiveStep("location");
        }}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Location</p>
            <p className="text-xs text-gray-500">
              {getFilterValue("location") || "All locations"}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Property Type */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActiveStep("propertyType");
        }}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
            <span className="text-xl">🏢</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Property Type</p>
            <p className="text-xs text-gray-500">
              {getFilterValue("propertyType") || "All types"}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Unit Style */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActiveStep("unitStyle");
        }}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
            <Home className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">Unit Style</p>
            <p className="text-xs text-gray-500">
              {getFilterValue("unitStyle") || "All styles"}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Quick Filters */}
      <div className="pt-4">
        <p className="text-xs font-semibold text-gray-600 mb-3 px-1">
          Quick Filters
        </p>
        <div className="space-y-3">
          {/* Furnishing */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block px-1">
              Furnishing
            </label>
            <div className="grid grid-cols-2 gap-2">
              {furnishingTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilters({ ...filters, furnishing: type.value });
                  }}
                  className={`p-3 rounded-lg text-xs font-semibold transition-all ${
                    filters.furnishing === type.value
                      ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Size */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-2 block px-1">
              Minimum Size (sqm)
            </label>
            <input
              type="number"
              placeholder="Enter minimum size"
              value={filters.minSize || ""}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                setFilters({ ...filters, minSize: Number(e.target.value) });
              }}
              className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Price submenu
  const PriceMenu = () => (
    <div className="space-y-4 pb-20">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActiveStep("main");
        }}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </button>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-900">
          Select a price range
        </p>
        {priceRanges.map((range) => (
          <button
            key={range.label}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickPrice(range.min, range.max);
            }}
            className={`w-full p-4 text-left rounded-xl transition-all ${
              filters.minPrice === range.min && filters.maxPrice === range.max
                ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <span className="font-semibold">{range.label}</span>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Or enter custom range
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Min Price
            </label>
            <input
              type="number"
              placeholder="₱0"
              value={filters.minPrice || ""}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                setFilters({ ...filters, minPrice: Number(e.target.value) });
              }}
              className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Max Price
            </label>
            <input
              type="number"
              placeholder="Any"
              value={filters.maxPrice || ""}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                setFilters({ ...filters, maxPrice: Number(e.target.value) });
              }}
              className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Location submenu
  const LocationMenu = () => (
    <div className="space-y-4 pb-20">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActiveStep("main");
        }}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </button>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Select location
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFilters({ ...filters, location: "" });
          }}
          className={`w-full p-4 text-left rounded-xl transition-all ${
            !filters.location
              ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <span className="font-semibold">All Locations</span>
        </button>

        <p className="text-xs font-semibold text-gray-600 mt-4 mb-2">
          Popular Locations
        </p>
        {locations
          .filter((loc) => loc.popular)
          .map((loc) => (
            <button
              key={loc.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFilters({ ...filters, location: loc.value });
              }}
              className={`w-full p-4 text-left rounded-xl transition-all ${
                filters.location === loc.value
                  ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <span className="font-semibold">{loc.label}</span>
            </button>
          ))}

        <p className="text-xs font-semibold text-gray-600 mt-4 mb-2">
          Other Locations
        </p>
        {locations
          .filter((loc) => !loc.popular)
          .map((loc) => (
            <button
              key={loc.value}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFilters({ ...filters, location: loc.value });
              }}
              className={`w-full p-4 text-left rounded-xl transition-all ${
                filters.location === loc.value
                  ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <span className="font-semibold">{loc.label}</span>
            </button>
          ))}
      </div>
    </div>
  );

  // Property Type submenu
  const PropertyTypeMenu = () => (
    <div className="space-y-4 pb-20">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActiveStep("main");
        }}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </button>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Select property type
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFilters({ ...filters, propertyType: "" });
          }}
          className={`w-full p-4 text-left rounded-xl transition-all ${
            !filters.propertyType
              ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <span className="font-semibold">All Types</span>
        </button>

        {propertyTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFilters({ ...filters, propertyType: type.value });
            }}
            className={`w-full p-4 text-left rounded-xl transition-all flex items-center gap-3 ${
              filters.propertyType === type.value
                ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <span className="text-2xl">{type.icon}</span>
            <span className="font-semibold">{type.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Unit Style submenu
  const UnitStyleMenu = () => (
    <div className="space-y-4 pb-20">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActiveStep("main");
        }}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </button>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Select unit style
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFilters({ ...filters, unitStyle: "" });
          }}
          className={`w-full p-4 text-left rounded-xl transition-all ${
            !filters.unitStyle
              ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <span className="font-semibold">All Styles</span>
        </button>

        {unitStyles.map((style) => (
          <button
            key={style.value}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFilters({ ...filters, unitStyle: style.value });
            }}
            className={`w-full p-4 text-left rounded-xl transition-all flex items-center gap-3 ${
              filters.unitStyle === style.value
                ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            <span className="text-2xl">{style.icon}</span>
            <span className="font-semibold">{style.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {activeStep === "main" && <MainMenu />}
        {activeStep === "price" && <PriceMenu />}
        {activeStep === "location" && <LocationMenu />}
        {activeStep === "propertyType" && <PropertyTypeMenu />}
        {activeStep === "unitStyle" && <UnitStyleMenu />}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="border-t border-gray-200 bg-white p-4 space-y-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClearFilters();
          }}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
        >
          Clear All Filters
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all active:scale-95"
        >
          Show Results
        </button>
      </div>
    </div>
  );
}
