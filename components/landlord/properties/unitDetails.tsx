/**
 * @component    UnitDetails
 * @desc         Displays unit details and analytics info (no lease data).
 * @usedIn       app/pages/landlord/properties/[id]/units/details/[unitId]/page.js
 * @props
 *    - unitId: string
 */

"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import MeterReadings from "@/components/landlord/properties/units/MeterReadings";
import UnitAnalytics from "@/components/landlord/properties/units/UnitAnalytics";

export default function UnitDetails({ unitId }) {
  const router = useRouter();
  const [propertyName, setPropertyName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitDetails, setUnitDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== "undefined" && unitId) {
      return localStorage.getItem(`unitDetailsActiveTab_${unitId}`) || "details";
    }
    return "details";
  });

  useEffect(() => {
    fetchUnitData();
  }, [unitId]);

  useEffect(() => {
    if (unitId && activeTab) {
      localStorage.setItem(`unitDetailsActiveTab_${unitId}`, activeTab);
    }
  }, [activeTab, unitId]);

  const fetchUnitData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/propertyListing/getPropertyDetailByUnitId?unit_id=${unitId}`);
      const prop = res.data?.propertyDetails;
      if (prop) {
        setPropertyName(prop.property_name || "Unnamed Property");
        setUnitName(prop.unit_name || "Unnamed Unit");
        setUnitDetails(prop);
      } else {
        setPropertyName("");
        setUnitName("");
      }
    } catch (err: any) {
      console.error("❌ Error fetching unit details:", err);
      Swal.fire("Error", "Failed to load unit details.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <p className="text-center text-gray-500 mt-10">Loading unit details...</p>;

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-4 sm:p-6">
        {/* Back Button */}
        <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 sm:mb-6 p-2 hover:bg-blue-50 rounded-lg transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Units
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-7 mb-6 transition-all">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1">
            {propertyName}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Unit: {unitName}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide space-x-4 sm:space-x-6">

          <button
              onClick={() => setActiveTab("meter")}
              className={`pb-2 px-3 sm:px-4 font-medium text-sm sm:text-base ${
                  activeTab === "meter"
                      ? "border-b-2 border-blue-600 text-blue-700"
                      : "text-gray-500 hover:text-blue-600"
              }`}
          >
            Meter Readings
          </button>

          <button
              onClick={() => setActiveTab("analytics")}
              className={`pb-2 px-3 sm:px-4 font-medium text-sm sm:text-base ${
                  activeTab === "analytics"
                      ? "border-b-2 border-blue-600 text-blue-700"
                      : "text-gray-500 hover:text-blue-600"
              }`}
          >
            Analytics
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 sm:p-6">

          {activeTab === "meter" && (
              <MeterReadings unitId={unitId} />
          )}

          {activeTab === "analytics" && (
              <UnitAnalytics unitId={unitId} />
          )}
        </div>
      </div>
  );
}
