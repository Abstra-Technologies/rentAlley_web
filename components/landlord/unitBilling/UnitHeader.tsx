"use client";

import React from "react";

export default function UnitHeader({ property, unit }: any) {
  return (
    <div className="mb-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">
        {property.property_name} — Unit {unit.unit_name} Billing
      </h1>
      <p className="text-sm text-gray-600 mt-1">
        Create or update this month’s billing for this unit.
      </p>
    </div>
  );
}
