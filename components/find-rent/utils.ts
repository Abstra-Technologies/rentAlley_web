// ============================================================
// UPKYP FIND-RENT UTILITIES
// ============================================================

// Peso symbol constant (prevents Unicode issues)
export const PESO = "\u20B1";

// Animation timing functions
export const SPRING = {
  snappy: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  apple: "cubic-bezier(0.25, 0.1, 0.25, 1)",
} as const;

// Gesture thresholds for touch interactions
export const GESTURE = {
  dismissVelocity: 0.5,
  dismissDistance: 100,
  resistance: 0.55,
  maxStretch: 120,
} as const;

// Property type configurations
export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "duplex", label: "Duplex" },
  { value: "house", label: "House" },
  { value: "townhouse", label: "Townhouse" },
  { value: "office_space", label: "Office Space" },
  { value: "warehouse", label: "Warehouse" },
  { value: "dormitory", label: "Dormitory" },
] as const;

// Unit style configurations
export const UNIT_STYLES = [
  { value: "studio", label: "Studio" },
  { value: "1-bedroom", label: "1 Bedroom" },
  { value: "2-bedroom", label: "2 Bedroom" },
  { value: "3-bedroom", label: "3+ Bedroom" },
  { value: "penthouse", label: "Penthouse" },
] as const;

// Furnishing options
export const FURNISHING_OPTIONS = [
  { value: "fully_furnished", label: "Fully Furnished" },
  { value: "semi_furnished", label: "Semi Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
] as const;

// Philippine regions/locations
export const LOCATIONS = [
  { value: "metro_manila", label: "Metro Manila", popular: true },
  { value: "cebu", label: "Cebu", popular: true },
  { value: "davao", label: "Davao", popular: true },
  { value: "laguna", label: "Laguna", popular: true },
  { value: "cavite", label: "Cavite", popular: false },
  { value: "bulacan", label: "Bulacan", popular: false },
  { value: "pampanga", label: "Pampanga", popular: false },
  { value: "batangas", label: "Batangas", popular: false },
  { value: "rizal", label: "Rizal", popular: false },
  { value: "iloilo", label: "Iloilo", popular: false },
  { value: "pangasinan", label: "Pangasinan", popular: false },
  { value: "zambales", label: "Zambales", popular: false },
] as const;

// Price range presets
export const PRICE_RANGES = [
  { min: 0, max: 5000, label: `Under ${PESO}5K` },
  { min: 5000, max: 10000, label: `${PESO}5K - ${PESO}10K` },
  { min: 10000, max: 20000, label: `${PESO}10K - ${PESO}20K` },
  { min: 20000, max: 35000, label: `${PESO}20K - ${PESO}35K` },
  { min: 35000, max: 50000, label: `${PESO}35K - ${PESO}50K` },
  { min: 50000, max: 0, label: `${PESO}50K+` },
] as const;

// Size presets (in sqm)
export const SIZE_PRESETS = [15, 25, 35, 50, 75, 100] as const;

// Format currency helper
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format location helper
export const formatLocation = (city: string, province: string): string => {
  const format = (str: string) =>
    str
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  return `${format(city)}, ${format(province)}`;
};

// Format unit style helper
export const formatUnitStyle = (style: string): string => {
  if (!style) return "";
  return style
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

// Cluster configuration for map
export const CLUSTER_CONFIG = {
  overlapThreshold: 40,
  spiderfyRadius: 60,
  maxSpiderfyItems: 8,
} as const;
