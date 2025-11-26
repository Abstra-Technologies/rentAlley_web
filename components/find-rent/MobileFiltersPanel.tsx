"use client";
import { FilterState } from "../../types/types";
import {
  MapPin,
  DollarSign,
  Home,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Check,
  Sofa,
  Maximize,
} from "lucide-react";
import { useEffect, useState } from "react";

interface MobileFiltersPanelProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  onClose?: () => void;
}

type ActiveStep = "main" | "price" | "location" | "propertyType" | "unitStyle";

export default function MobileFiltersPanel({
  filters,
  setFilters,
  onClose,
}: MobileFiltersPanelProps) {
  const [activeStep, setActiveStep] = useState<ActiveStep>("main");
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

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

  // Sync local filters when parent filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleQuickPrice = (min: number, max: number) => {
    setLocalFilters({ ...localFilters, minPrice: min, maxPrice: max });
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      searchQuery: filters.searchQuery || "",
      propertyType: "",
      furnishing: "",
      minPrice: 0,
      maxPrice: 0,
      minSize: 0,
      location: "",
      unitStyle: "",
    };
    setLocalFilters(clearedFilters);
  };

  const handleApply = () => {
    setFilters(localFilters);
    onClose?.();
  };

  const getFilterValue = (key: string) => {
    if (key === "location" && localFilters.location) {
      return (
        locations.find((l) => l.value === localFilters.location)?.label || ""
      );
    }
    if (key === "propertyType" && localFilters.propertyType) {
      return (
        propertyTypes.find((p) => p.value === localFilters.propertyType)
          ?.label || ""
      );
    }
    if (key === "unitStyle" && localFilters.unitStyle) {
      return (
        unitStyles.find((u) => u.value === localFilters.unitStyle)?.label || ""
      );
    }
    if (key === "price") {
      if (localFilters.minPrice && localFilters.maxPrice) {
        return `₱${localFilters.minPrice.toLocaleString()} - ₱${localFilters.maxPrice.toLocaleString()}`;
      }
      if (localFilters.minPrice)
        return `From ₱${localFilters.minPrice.toLocaleString()}`;
      if (localFilters.maxPrice)
        return `Up to ₱${localFilters.maxPrice.toLocaleString()}`;
      return "";
    }
    return "";
  };

  const activeFilterCount = Object.entries(localFilters).filter(
    ([key, value]) => {
      if (key === "searchQuery") return false;
      if (typeof value === "number") return value > 0;
      return value !== "";
    }
  ).length;

  // Reusable selection button
  const SelectionButton = ({
    isSelected,
    onClick,
    children,
    icon,
    showCheck = true,
  }: {
    isSelected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    icon?: string;
    showCheck?: boolean;
  }) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        w-full p-4 text-left rounded-2xl transition-all duration-200 flex items-center gap-3
        ${
          isSelected
            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-emerald-600/20"
            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
        }
      `}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      <span className="font-semibold flex-1">{children}</span>
      {showCheck && isSelected && <Check className="w-5 h-5" />}
    </button>
  );

  // Back button component
  const BackButton = () => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setActiveStep("main");
      }}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm mb-4"
    >
      <ChevronLeft className="w-4 h-4" />
      Back
    </button>
  );

  // Main menu view
  const MainMenu = () => (
    <div className="space-y-3 pb-4">
      {/* Filter Navigation Cards */}
      {[
        {
          key: "price",
          icon: DollarSign,
          label: "Price Range",
          value: getFilterValue("price") || "Any price",
        },
        {
          key: "location",
          icon: MapPin,
          label: "Location",
          value: getFilterValue("location") || "All locations",
        },
        {
          key: "propertyType",
          icon: null,
          emoji: "🏢",
          label: "Property Type",
          value: getFilterValue("propertyType") || "All types",
        },
        {
          key: "unitStyle",
          icon: Home,
          label: "Unit Style",
          value: getFilterValue("unitStyle") || "All styles",
        },
      ].map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveStep(item.key as ActiveStep);
          }}
          className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-200 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
              {item.emoji ? (
                <span className="text-xl">{item.emoji}</span>
              ) : item.icon ? (
                <item.icon className="w-5 h-5 text-emerald-600" />
              ) : null}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.value}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      ))}

      {/* Quick Filters Section */}
      <div className="pt-4 mt-2 border-t border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
          Quick Filters
        </p>

        {/* Furnishing */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-700 mb-2 block px-1">
            Furnishing
          </label>
          <div className="grid grid-cols-2 gap-2">
            {furnishingTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalFilters({ ...localFilters, furnishing: type.value });
                }}
                className={`
                  p-3 rounded-xl text-sm font-semibold transition-all
                  ${
                    localFilters.furnishing === type.value
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }
                `}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Minimum Size */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block px-1">
            Minimum Size (sqm)
          </label>
          <div className="relative">
            <Maximize className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              placeholder="Enter minimum size"
              value={localFilters.minSize || ""}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                setLocalFilters({
                  ...localFilters,
                  minSize: Number(e.target.value),
                });
              }}
              className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">
              sqm
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Price submenu
  const PriceMenu = () => (
    <div className="space-y-3 pb-4">
      <BackButton />

      <div className="space-y-2">
        <p className="text-base font-bold text-gray-900 mb-3">
          Select a price range
        </p>
        {priceRanges.map((range) => (
          <SelectionButton
            key={range.label}
            isSelected={
              localFilters.minPrice === range.min &&
              localFilters.maxPrice === range.max
            }
            onClick={() => handleQuickPrice(range.min, range.max)}
          >
            {range.label}
          </SelectionButton>
        ))}
      </div>

      <div className="pt-4 mt-2 border-t border-gray-100">
        <p className="text-base font-bold text-gray-900 mb-3">
          Or enter custom range
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Min Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                ₱
              </span>
              <input
                type="number"
                placeholder="0"
                value={localFilters.minPrice || ""}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  setLocalFilters({
                    ...localFilters,
                    minPrice: Number(e.target.value),
                  });
                }}
                className="w-full pl-8 pr-3 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              Max Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                ₱
              </span>
              <input
                type="number"
                placeholder="Any"
                value={localFilters.maxPrice || ""}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  setLocalFilters({
                    ...localFilters,
                    maxPrice: Number(e.target.value),
                  });
                }}
                className="w-full pl-8 pr-3 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Location submenu
  const LocationMenu = () => (
    <div className="space-y-3 pb-4">
      <BackButton />

      <p className="text-base font-bold text-gray-900 mb-3">Select location</p>

      <SelectionButton
        isSelected={!localFilters.location}
        onClick={() => setLocalFilters({ ...localFilters, location: "" })}
      >
        All Locations
      </SelectionButton>

      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-2 px-1">
        Popular
      </p>
      {locations
        .filter((loc) => loc.popular)
        .map((loc) => (
          <SelectionButton
            key={loc.value}
            isSelected={localFilters.location === loc.value}
            onClick={() =>
              setLocalFilters({ ...localFilters, location: loc.value })
            }
          >
            {loc.label}
          </SelectionButton>
        ))}

      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-2 px-1">
        Other Regions
      </p>
      {locations
        .filter((loc) => !loc.popular)
        .map((loc) => (
          <SelectionButton
            key={loc.value}
            isSelected={localFilters.location === loc.value}
            onClick={() =>
              setLocalFilters({ ...localFilters, location: loc.value })
            }
          >
            {loc.label}
          </SelectionButton>
        ))}
    </div>
  );

  // Property Type submenu
  const PropertyTypeMenu = () => (
    <div className="space-y-3 pb-4">
      <BackButton />

      <p className="text-base font-bold text-gray-900 mb-3">
        Select property type
      </p>

      <SelectionButton
        isSelected={!localFilters.propertyType}
        onClick={() => setLocalFilters({ ...localFilters, propertyType: "" })}
      >
        All Types
      </SelectionButton>

      {propertyTypes.map((type) => (
        <SelectionButton
          key={type.value}
          isSelected={localFilters.propertyType === type.value}
          onClick={() =>
            setLocalFilters({ ...localFilters, propertyType: type.value })
          }
          icon={type.icon}
        >
          {type.label}
        </SelectionButton>
      ))}
    </div>
  );

  // Unit Style submenu
  const UnitStyleMenu = () => (
    <div className="space-y-3 pb-4">
      <BackButton />

      <p className="text-base font-bold text-gray-900 mb-3">
        Select unit style
      </p>

      <SelectionButton
        isSelected={!localFilters.unitStyle}
        onClick={() => setLocalFilters({ ...localFilters, unitStyle: "" })}
      >
        All Styles
      </SelectionButton>

      {unitStyles.map((style) => (
        <SelectionButton
          key={style.value}
          isSelected={localFilters.unitStyle === style.value}
          onClick={() =>
            setLocalFilters({ ...localFilters, unitStyle: style.value })
          }
          icon={style.icon}
        >
          {style.label}
        </SelectionButton>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
        {activeStep === "main" && <MainMenu />}
        {activeStep === "price" && <PriceMenu />}
        {activeStep === "location" && <LocationMenu />}
        {activeStep === "propertyType" && <PropertyTypeMenu />}
        {activeStep === "unitStyle" && <UnitStyleMenu />}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="sticky bottom-0 border-t border-gray-100 bg-white p-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClearFilters();
            }}
            className="flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleApply();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:shadow-xl transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            {activeFilterCount > 0
              ? `Apply ${activeFilterCount} Filters`
              : "Show Results"}
          </button>
        </div>
      </div>
    </div>
  );
}
