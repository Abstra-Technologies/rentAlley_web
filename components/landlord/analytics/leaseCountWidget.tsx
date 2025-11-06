"use client";

import { useState, useEffect } from "react";
import { Calendar, AlertCircle } from "lucide-react";
import LoadingScreen from "@/components/loadingScreen";
import Link from "next/link";

const LeaseWidget = ({ landlord_id }) => {
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeases = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `/api/analytics/landlord/getLeaseCountDays?landlord_id=${landlord_id}`
                );
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch lease data");
                }

                setLeases(data);
            } catch (err) {
                console.error("API request failed:", err);
                setError("Unable to load lease information due to an API error.");
            } finally {
                setLoading(false);
            }
        };

        fetchLeases();
    }, [landlord_id]);

    // ✅ Loading screen - fully covers viewport
    if (loading) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90">
                <LoadingScreen message="Loading lease information..." />
            </div>
        );
    }

    // ✅ Error message block - responsive
    if (error) {
        return (
            <div className="flex items-center justify-center p-4 bg-red-100 border border-red-400 rounded-xl m-4">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-red-700 text-sm sm:text-base text-center">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md sm:shadow-lg rounded-2xl w-full max-w-3xl mx-auto p-4 sm:p-6 border border-gray-200 transition-all duration-300">
            {/* Header */}
            <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                📋 Active Leases
                <span className="text-xs sm:text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {leases.length}
        </span>
            </h3>

            {/* No leases */}
            {leases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-gray-500">
                    <Calendar className="w-8 h-8 sm:w-10 sm:h-10 mb-2 text-gray-400" />
                    <p className="text-sm sm:text-base">No active leases found.</p>
                </div>
            ) : (
                <>
                    {/* Lease List */}
                    <ul className="divide-y divide-gray-100">
                        {leases.slice(0, 5).map((lease) => (
                            <li
                                key={lease.agreement_id}
                                className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
                            >
                                {/* Left: Unit Info */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-sm font-semibold flex-shrink-0">
                                        {lease.unit_name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm sm:text-base font-medium text-gray-800 truncate">
                                            {lease.property_name} — {lease.unit_name}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500">
                                            Ends:{" "}
                                            {new Date(lease.end_date).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Right: Status */}
                                <div className="flex items-center gap-2">
                  <span
                      className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap ${
                          lease.daysRemaining <= 30
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                      }`}
                  >
                    {lease.daysRemaining > 0
                        ? `${lease.daysRemaining} days left`
                        : "Expired"}
                  </span>
                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Show All Link */}
                    {leases.length > 5 && (
                        <div className="mt-4 text-center">
                            <Link
                                href="/pages/landlord/contracts"
                                className="text-sm sm:text-base text-blue-600 hover:underline font-medium"
                            >
                                Show All
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LeaseWidget;
