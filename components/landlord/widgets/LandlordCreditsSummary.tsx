"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Props {
    landlordId: number | undefined;
}

export default function LandlordCreditsSummary({ landlordId }: Props) {
    const [totalCredits, setTotalCredits] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!landlordId) return;

        const fetchCredits = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/landlord/wallet?landlord_id=${landlordId}`);
                setTotalCredits(response.data.totalCredits || 0);
            } catch (error) {
                console.error("Error fetching wallet summary:", error);
                setTotalCredits(0);
            } finally {
                setLoading(false);
            }
        };

        fetchCredits();
    }, [landlordId]);

    return (
        <div className="w-full">
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 rounded-2xl shadow-md p-4 border border-emerald-100 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Left content */}
                    <div>
                        <p className="text-gray-600 text-sm font-medium">Total Credits</p>
                        {loading ? (
                            <p className="text-xl font-semibold text-gray-400 mt-1 animate-pulse">
                                Loading...
                            </p>
                        ) : (
                            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                                ₱
                                {(totalCredits || 0).toLocaleString("en-PH", {
                                    minimumFractionDigits: 2,
                                })}
                            </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Available funds ready for disbursement
                        </p>
                    </div>

                    {/* Icon + Button */}
                    <div className="flex flex-col items-end gap-2">
                        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-inner">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 8c-1.657 0-3 1.343-3 3h6c0-1.657-1.343-3-3-3zM6 8h.01M18 8h.01M6 12h12M6 16h12M6 20h12"
                                />
                            </svg>
                        </div>
                        <button
                            onClick={() => console.log("Request disbursement clicked")}
                            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md active:scale-95 transition-all duration-200"
                        >
                            Request
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
