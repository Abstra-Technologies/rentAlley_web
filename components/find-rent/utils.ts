export const sanitizeInput = (str: string): string => {
  if (!str) return "";
  return str.replace(/[<>]/g, "");
};

export const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString()}`;
};

export const formatLocation = (city: string, province: string): string => {
  const formattedProvince = province
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return `${city}, ${formattedProvince}`;
};
