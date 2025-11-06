
// utils/formatters.ts

/**
 * Sanitize input string to prevent XSS or unwanted tags.
 */
export const sanitizeInput = (str: string): string => {
    if (!str) return "";
    return str.replace(/[<>]/g, "");
};

/**
 * Format a number or string into Philippine Peso currency.
 */
export const formatCurrency = (
    amount: number | string | null | undefined
): string => {
    const numAmount =
        typeof amount === "number" ? amount : parseFloat(String(amount || 0));
    if (isNaN(numAmount)) return "₱0.00";
    return `₱${numAmount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

/**
 * Format a date string into "MMM DD, YYYY" format.
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

/**
 * Safely convert any value into a number, defaulting to 0 if invalid.
 */
export const toNumber = (val: any): number => {
    if (val === null || val === undefined || val === "") return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
};
