"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Home,
    Activity,
    Gauge,
    Printer,
} from "lucide-react";

import MeterReadings from "@/components/landlord/properties/units/MeterReadings";
import UnitAnalytics from "@/components/landlord/properties/units/UnitAnalytics";
import UnitLeaseHistory from "@/components/landlord/properties/units/UnitLeaseHistory";

export default function UnitDetails({ unitId }: { unitId: string }) {
    const router = useRouter();

    const [propertyName, setPropertyName] = useState("");
    const [unitName, setUnitName] = useState("");
    const [unitDetails, setUnitDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<string>(() => {
        if (typeof window !== "undefined" && unitId) {
            return (
                localStorage.getItem(`unitDetailsActiveTab_${unitId}`) || "meter"
            );
        }
        return "meter";
    });

    /* ------------------------------------------------------------------ */
    /* DATA FETCH                                                         */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
        fetchUnitData();
    }, [unitId]);

    useEffect(() => {
        if (unitId && activeTab) {
            localStorage.setItem(
                `unitDetailsActiveTab_${unitId}`,
                activeTab
            );
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
                setUnitDetails(null);
            }
        } catch (err) {
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

    /* ------------------------------------------------------------------ */
    /* PRINT QR                                                           */
    /* ------------------------------------------------------------------ */
    const handlePrintQR = () => {
        if (!unitId) return;
        window.open(`/api/landlord/unit/qr-code/print?unit_id=${unitId}`, "_blank");
    };

    /* ------------------------------------------------------------------ */
    /* LOADING STATE                                                      */
    /* ------------------------------------------------------------------ */
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 px-4 pt-20">
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse mb-4" />
                <div className="h-20 bg-gray-200 rounded-xl animate-pulse mb-6" />
                <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
            </div>
        );
    }

    /* ------------------------------------------------------------------ */
    /* RENDER                                                             */
    /* ------------------------------------------------------------------ */
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">

                {/* BACK */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 px-3 py-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Back to Units</span>
                </button>

                {/* HEADER */}
                <div className="mb-6">
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                        {/* LEFT */}
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center">
                                <Home className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {propertyName}
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Unit: {unitName}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT – QR */}
                        {unitDetails?.qr_code_url && (
                            <div className="flex items-center gap-4">
                                <div className="border border-gray-200 rounded-lg p-2 bg-white">
                                    <img
                                        src={unitDetails.qr_code_url}
                                        alt="Unit QR Code"
                                        className="w-24 h-24 object-contain"
                                    />
                                </div>

                                <button
                                    onClick={handlePrintQR}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg
                             bg-gray-900 text-white hover:bg-black transition"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print QR
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                        <div className="flex overflow-x-auto">
                            <button
                                onClick={() => setActiveTab("meter")}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                                    activeTab === "meter"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <Gauge className="h-4 w-4" />
                                Meter
                            </button>

                            <button
                                onClick={() => setActiveTab("analytics")}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                                    activeTab === "analytics"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <Activity className="h-4 w-4" />
                                Analytics
                            </button>

                            <button
                                onClick={() => setActiveTab("history")}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                                    activeTab === "history"
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <Activity className="h-4 w-4" />
                                Lease History
                            </button>
                        </div>
                    </div>

                    {/* TAB CONTENT */}
                    <div className="p-4 md:p-6">
                        {activeTab === "meter" && <MeterReadings unitId={unitId} />}
                        {activeTab === "analytics" && (
                            <UnitAnalytics unitId={unitId} />
                        )}
                        {activeTab === "history" && (
                            <UnitLeaseHistory unitId={unitId} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
