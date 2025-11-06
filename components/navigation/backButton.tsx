"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export function BackButton({
  label = "Back",
  landlordFallback = "/pages/landlord/property-listing",
  tenantFallback = "/pages/tenant/myUnit",
}: {
  label?: string;
  landlordFallback?: string;
  tenantFallback?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    // Check if there's navigation history
    setHasHistory(window.history.length > 1);
  }, []);

  const handleBack = () => {
    // Determine if user is tenant or landlord based on URL
    const isTenant = pathname?.includes("/tenant");
    const isLandlord = pathname?.includes("/landlord");

    if (hasHistory && window.history.length > 2) {
      // User has navigation history, use back
      router.back();
    } else {
      // No history, redirect to appropriate dashboard
      if (isTenant) {
        router.replace(tenantFallback);
      } else if (isLandlord) {
        router.replace(landlordFallback);
      } else {
        // Fallback: try to go back, or redirect to tenant dashboard
        router.replace(tenantFallback);
      }
    }
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold
        bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900
        border border-gray-200 hover:border-gray-300
        rounded-lg shadow-sm hover:shadow-md
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
