"use client";

import { useEffect, useState } from "react";
import { HomeIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface UnitInfo {
  unit_id: number;
  unit_name: string;
  property_name: string;
  status: string;
}

interface ActiveRentConsolidatedCardsProps {
  tenant_id?: number;
}

export default function ActiveRentConsolidatedCards({
  tenant_id,
}: ActiveRentConsolidatedCardsProps) {
  const [totalActive, setTotalActive] = useState<number>(0);
  const [units, setUnits] = useState<UnitInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant_id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/analytics/tenant/consolidated/activeRentals?tenant_id=${tenant_id}`
        );
        if (!res.ok) throw new Error("Failed to fetch data");
        const data = await res.json();
        setTotalActive(data.totalActiveUnits);
        setUnits(data.units);
      } catch (err) {
        console.error(err);
        setError("Unable to load rental data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenant_id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-100 border-t-emerald-500 mb-2"></div>
        <p className="text-gray-500 text-sm font-medium">Loading rentals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="p-2 bg-red-100 rounded-full mb-2">
          <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-red-600 text-center text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with icon - Consistent with Payables */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
            <HomeIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Active Rentals
          </h3>
        </div>
        <p className="text-xs text-gray-600 ml-10">Your current properties</p>
      </div>

      {/* Total Counter - Compact version matching Payables */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm text-center text-white mb-4">
        <p className="text-xs font-semibold tracking-wide uppercase opacity-90 mb-1">
          Active Units
        </p>
        <p className="text-3xl font-bold">{totalActive}</p>
      </div>

      {/* Units List - Scrollable matching Payables height */}
      {units && units.length > 0 && (
        <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
          {units.map((unit) => (
            <div
              key={unit.unit_id}
              className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-white rounded-lg flex-shrink-0">
                  <HomeIcon className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {unit.unit_name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">
                    {unit.property_name}
                  </p>
                </div>
                <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full flex-shrink-0">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {units && units.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="p-3 bg-gray-100 rounded-full mb-2">
            <HomeIcon className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-center text-sm font-medium">
            No active rentals
          </p>
        </div>
      )}
    </div>
  );
}
