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
    <div className="w-full space-y-5">
      {/* Total Active Counter */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg text-center text-white">
        <div className="flex items-center justify-center gap-2 mb-2">
          <HomeIcon className="w-5 h-5" />
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Active Rentals
          </h2>
        </div>
        <p className="text-4xl sm:text-5xl font-bold">{totalActive}</p>
        <p className="text-emerald-50 text-sm mt-2">
          {totalActive === 1 ? "active unit" : "active units"}
        </p>
      </div>

      {/* Units List */}
      {units && units.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 px-2 uppercase tracking-wide">
            Your Properties
          </p>
          {units.map((unit) => (
            <div
              key={unit.unit_id}
              className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex-shrink-0">
                  <HomeIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {unit.unit_name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {unit.property_name}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full flex-shrink-0">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
