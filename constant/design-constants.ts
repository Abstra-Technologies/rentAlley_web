/**
 * UpKyp Design System Constants
 * Centralized styling patterns for consistent UI/UX
 */

/* ============================================
   CARD STYLES
============================================ */

/**
 * Base card container - Use for all main dashboard cards
 */
export const CARD_BASE =
  "bg-white rounded-xl border border-gray-200 shadow-sm ring-1 ring-gray-100";

/**
 * Standard card hover effect - Consistent lift and highlight
 */
export const CARD_HOVER =
  "hover:-translate-y-[2px] hover:shadow-lg hover:ring-blue-200 transition-all duration-300";

/**
 * Clickable card - Combines base + hover + cursor
 */
export const CARD_INTERACTIVE = `${CARD_BASE} ${CARD_HOVER} cursor-pointer`;

/**
 * Standard card padding - Responsive spacing
 */
export const CARD_PADDING = "p-4 md:p-6";

/**
 * Complete card wrapper - Most common combination
 */
export const CARD_CONTAINER = `${CARD_BASE} ${CARD_PADDING}`;

/**
 * Complete interactive card - For clickable cards
 */
export const CARD_CONTAINER_INTERACTIVE = `${CARD_BASE} ${CARD_HOVER} ${CARD_PADDING} cursor-pointer`;

/* ============================================
   LIST ITEM STYLES
============================================ */

/**
 * Base list item - For items inside cards
 */
export const ITEM_BASE =
  "bg-white border border-gray-200 rounded-lg shadow-sm ring-1 ring-gray-100";

/**
 * List item hover - Subtle lift for nested items
 */
export const ITEM_HOVER =
  "hover:-translate-y-[1px] hover:shadow-md hover:ring-blue-200 transition-all duration-200";

/**
 * Interactive list item - Complete combination
 */
export const ITEM_INTERACTIVE = `${ITEM_BASE} ${ITEM_HOVER} cursor-pointer`;

/* ============================================
   SECTION HEADERS
============================================ */

/**
 * Section header with gradient indicator
 */
export const SECTION_HEADER = "flex items-center gap-2";

/**
 * Gradient dot indicator
 */
export const GRADIENT_DOT =
  "w-2 h-2 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full";

/**
 * Section title text
 */
export const SECTION_TITLE = "text-sm md:text-base font-semibold text-gray-900";

/* ============================================
   GRADIENT BACKGROUNDS
============================================ */

/**
 * Primary gradient - Blue to Emerald
 */
export const GRADIENT_PRIMARY = "bg-gradient-to-r from-blue-600 to-emerald-600";

/**
 * Text gradient - For headings
 */
export const GRADIENT_TEXT =
  "bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent";

/**
 * Light gradient background
 */
export const GRADIENT_BG_LIGHT =
  "bg-gradient-to-br from-blue-100 to-emerald-100";

/**
 * Icon background gradient
 */
export const GRADIENT_ICON_BG =
  "bg-gradient-to-br from-emerald-100 to-emerald-200";

/* ============================================
   EMPTY STATES
============================================ */

/**
 * Empty state container
 */
export const EMPTY_STATE_CONTAINER = "flex items-center justify-center py-12";

/**
 * Empty state content wrapper
 */
export const EMPTY_STATE_CONTENT = "text-center";

/**
 * Empty state icon wrapper
 */
export const EMPTY_STATE_ICON =
  "w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner";

/**
 * Empty state title
 */
export const EMPTY_STATE_TITLE = "text-sm font-semibold text-gray-900 mb-1";

/**
 * Empty state description
 */
export const EMPTY_STATE_DESC = "text-xs text-gray-600";

/* ============================================
   LOADING STATES
============================================ */

/**
 * Skeleton loader
 */
export const SKELETON = "animate-pulse bg-gray-100 rounded-lg";

/**
 * Card skeleton - Standard card height
 */
export const CARD_SKELETON = "h-[240px] rounded-xl bg-gray-100 animate-pulse";

/* ============================================
   BUTTONS & INTERACTIVE ELEMENTS
============================================ */

/**
 * Primary button base
 */
export const BUTTON_PRIMARY =
  "px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105";

/**
 * Secondary button
 */
export const BUTTON_SECONDARY =
  "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium transition-all duration-200 hover:bg-gray-200";

/* ============================================
   STATUS BADGES
============================================ */

/**
 * Badge base styles
 */
export const BADGE_BASE =
  "inline-block text-xs px-2 py-0.5 rounded-full font-medium";

/**
 * Status badge variants
 */
export const STATUS_BADGES = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
  default: "bg-gray-100 text-gray-700",
} as const;

/* ============================================
   SCROLLBAR STYLES
============================================ */

/**
 * Custom scrollbar for lists
 */
export const CUSTOM_SCROLLBAR =
  "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100";

/* ============================================
   HELPER FUNCTIONS
============================================ */

/**
 * Combine multiple class strings
 */
export const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/**
 * Get status badge classes
 */
export const getStatusBadge = (status: string): string => {
  const normalizedStatus = status.toLowerCase();
  return `${BADGE_BASE} ${
    STATUS_BADGES[normalizedStatus as keyof typeof STATUS_BADGES] ||
    STATUS_BADGES.default
  }`;
};
