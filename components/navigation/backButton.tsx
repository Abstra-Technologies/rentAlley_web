"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export function BackButton({
  label = "Back",
  landlordFallback = "/pages/landlord/property-listing",
  tenantFallback = "/pages/tenant/myUnit",
  variant = "default",
}: {
  label?: string;
  landlordFallback?: string;
  tenantFallback?: string;
  variant?: "default" | "ghost" | "gradient";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    setHasHistory(window.history.length > 1);
  }, []);

  const handleBack = () => {
    const isTenant = pathname?.includes("/tenant");
    const isLandlord = pathname?.includes("/landlord");

    if (hasHistory && window.history.length > 2) {
      router.back();
    } else {
      if (isTenant) {
        router.replace(tenantFallback);
      } else if (isLandlord) {
        router.replace(landlordFallback);
      } else {
        router.replace(tenantFallback);
      }
    }
  };

  const variants = {
    default: `
      inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
      bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900
      border border-gray-300 hover:border-gray-400
      rounded-lg shadow-sm hover:shadow
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    `,
    ghost: `
      inline-flex items-center gap-2 px-3 py-2 text-sm font-medium
      text-gray-600 hover:text-gray-900
      hover:bg-gray-100
      rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    `,
    gradient: `
      inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
      bg-gradient-to-r from-blue-600 to-emerald-600 
      hover:from-blue-700 hover:to-emerald-700
      text-white
      rounded-lg shadow-md hover:shadow-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    `,
  };

  return (
    <button
      onClick={handleBack}
      className={variants[variant]}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
