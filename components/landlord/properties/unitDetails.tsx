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
import { ArrowLeft, Home, Activity, Gauge } from "lucide-react";
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
      return localStorage.getItem(`unitDetailsActiveTab_${unitId}`) || "meter";
    }
    return "meter";
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
      const res = await axios.get(
        `/api/propertyListing/getPropertyDetailByUnitId?unit_id=${unitId}`
      );
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
      Swal.fire({
        title: "Error",
        text: "Failed to load unit details.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading unit details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Proper spacing for navbar and sidebar */}
      <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Units</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {propertyName}
              </h1>
              <p className="text-sm text-gray-600 mt-1">Unit: {unitName}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab("meter")}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "meter"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <Gauge className="h-4 w-4" />
                <span>Meter</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "analytics"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <Activity className="h-4 w-4" />
                <span>Analytics</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-6">
            {activeTab === "meter" && <MeterReadings unitId={unitId} />}

            {activeTab === "analytics" && <UnitAnalytics unitId={unitId} />}
          </div>
        </div>
      </div>
    </div>
  );
}
