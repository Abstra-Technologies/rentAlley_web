"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import PropertyMap with no SSR
const PropertyMap = dynamic(
  () => import("@/components/landlord/createProperty/propertyMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-gray-500">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default function PropertyMapWrapper({ coordinates, setFields }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Ensure client-side only rendering
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <PropertyMap coordinates={coordinates} setFields={setFields} />
    </div>
  );
}
