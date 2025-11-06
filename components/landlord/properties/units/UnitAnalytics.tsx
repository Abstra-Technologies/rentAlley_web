"use client";
import React from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import UnitConsumptionChart from "@/components/landlord/properties/units/UnitConsumptionChart";

/**
 * @component    UnitAnalytics
 * @desc         Displays key metrics related to a specific unit (occupancy, billing, maintenance).
 * @usedIn       UnitDetails (Analytics Tab)
 * @props
 *    - unitId: string
 */

export default function UnitAnalytics({ unitId }: { unitId: string }) {
    return (
        <div className="space-y-6">
            <UnitConsumptionChart unitId={unitId} />
        </div>
    );
}

