"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Droplets, Zap, Loader2 } from "lucide-react";

interface Props {
  property_id: string;
}

/**
 * Lists ALL units under a property with their latest water/electric readings.
 * Auto-adjusts columns depending on which utilities are submetered.
 */
export default function PropertyUnitMeterList({ property_id }: Props) {
  const [units, setUnits] = useState<any[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!property_id) return;
    loadData();
  }, [property_id]);

  async function loadData() {
    try {
      setLoading(true);

      // 1. Fetch property rules (submetering flags)
      const propRes = await axios.get(
        `/api/propertyListing/getPropDetailsById?property_id=${property_id}`
      );
      
      setProperty(propRes.data.property);

      // 2. Fetch units belonging to this property
      const unitRes = await axios.get(
        `/api/landlord/properties/getUnits?property_id=${property_id}`
      );
      const units = unitRes.data.units;

      // 3. Fetch latest meter readings for each unit
      const merged = [];

      for (const u of units) {
        const readingRes = await axios.get(
          `/api/landlord/billing/submetered/getUnitBilling?unit_id=${u.unit_id}`
        );
        const eb = readingRes.data.existingBilling;

        merged.push({
          ...u,
          water_prev: eb?.water_prev || null,
          water_curr: eb?.water_curr || null,
          elec_prev: eb?.elec_prev || null,
          elec_curr: eb?.elec_curr || null,
        });
      }

      setUnits(merged);
    } catch (err) {
      console.error("Meter list load error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="w-full flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  if (!property)
    return (
      <p className="text-center text-gray-500 py-6">Property not found.</p>
    );

  const hasWater = property.water_billing_type === "submetered";
  const hasElectric = property.electricity_billing_type === "submetered";

  if (!hasWater && !hasElectric) {
    return (
      <p className="text-center text-gray-500 py-10">
        This property does not use submetered utilities.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        Unit Meter Readings
      </h2>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-3 py-2 border">Unit Name</th>

              {hasWater && (
                <>
                  <th className="px-3 py-2 border flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-600" /> Water Prev
                  </th>
                  <th className="px-3 py-2 border">Water Curr</th>
                  <th className="px-3 py-2 border">Usage (m³)</th>
                </>
              )}

              {hasElectric && (
                <>
                  <th className="px-3 py-2 border flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" /> Elec Prev
                  </th>
                  <th className="px-3 py-2 border">Elec Curr</th>
                  <th className="px-3 py-2 border">Usage (kWh)</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {units.map((u) => (
              <tr key={u.unit_id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 border font-semibold">
                  {u.unit_name}
                </td>

                {/* WATER */}
                {hasWater && (
                  <>
                    <td className="px-3 py-2 border text-blue-700">
                      {u.water_prev ?? "—"}
                    </td>
                    <td className="px-3 py-2 border text-blue-700">
                      {u.water_curr ?? "—"}
                    </td>
                    <td className="px-3 py-2 border font-semibold">
                      {u.water_prev != null && u.water_curr != null
                        ? (u.water_curr - u.water_prev).toFixed(2)
                        : "—"}
                    </td>
                  </>
                )}

                {/* ELECTRIC */}
                {hasElectric && (
                  <>
                    <td className="px-3 py-2 border text-amber-700">
                      {u.elec_prev ?? "—"}
                    </td>
                    <td className="px-3 py-2 border text-amber-700">
                      {u.elec_curr ?? "—"}
                    </td>
                    <td className="px-3 py-2 border font-semibold">
                      {u.elec_prev != null && u.elec_curr != null
                        ? (u.elec_curr - u.elec_prev).toFixed(2)
                        : "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-4 mt-4">
        {units.map((u) => (
          <div
            key={u.unit_id}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
            <p className="font-bold text-gray-900 mb-2">{u.unit_name}</p>

            {/* WATER */}
            {hasWater && (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Droplets className="w-4 h-4" />
                  <span className="font-semibold">Water</span>
                </div>
                <p className="text-sm text-gray-700">
                  Prev:{" "}
                  <span className="font-semibold">{u.water_prev ?? "—"}</span>
                </p>
                <p className="text-sm text-gray-700">
                  Curr:{" "}
                  <span className="font-semibold">{u.water_curr ?? "—"}</span>
                </p>
                <p className="text-sm text-gray-900 font-semibold mt-1">
                  Usage:{" "}
                  {u.water_prev != null && u.water_curr != null
                    ? (u.water_curr - u.water_prev).toFixed(2) + " m³"
                    : "—"}
                </p>
              </div>
            )}

            {/* ELECTRICITY */}
            {hasElectric && (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-amber-700 mb-1">
                  <Zap className="w-4 h-4" />
                  <span className="font-semibold">Electricity</span>
                </div>
                <p className="text-sm text-gray-700">
                  Prev:{" "}
                  <span className="font-semibold">{u.elec_prev ?? "—"}</span>
                </p>
                <p className="text-sm text-gray-700">
                  Curr:{" "}
                  <span className="font-semibold">{u.elec_curr ?? "—"}</span>
                </p>
                <p className="text-sm text-gray-900 font-semibold mt-1">
                  Usage:{" "}
                  {u.elec_prev != null && u.elec_curr != null
                    ? (u.elec_curr - u.elec_prev).toFixed(2) + " kWh"
                    : "—"}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
