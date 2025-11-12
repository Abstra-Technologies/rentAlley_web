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
        <div className="relative w-full max-w-2xl mx-auto flex justify-center px-3 sm:px-0 transition-all duration-300">
            {/* 💰 Wallet Card */}
            <div
                className="w-full bg-gradient-to-br from-white to-gray-50 border border-gray-100/70
      dark:from-gray-900 dark:to-gray-800 dark:border-gray-700
      rounded-2xl shadow-sm sm:shadow-md p-4 sm:p-6
      flex flex-col sm:flex-row sm:items-center sm:justify-between
      transition-all duration-300 hover:shadow-lg hover:scale-[1.01]"
            >
                {/* Left Section */}
                <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium">
                        Total Credits
                    </p>

                    {loading ? (
                        <p className="text-lg sm:text-xl font-semibold text-gray-400 mt-1 animate-pulse">
                            Loading...
                        </p>
                    ) : (
                        <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                            ₱
                            {(totalCredits || 0).toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                            })}
                        </p>
                    )}

                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                        Available funds ready for disbursement
                    </p>
                </div>

                {/* Right Section */}
                <div className="flex flex-col items-end gap-1.5 sm:gap-2 mt-3 sm:mt-0">
                    <div className="p-2 sm:p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-md sm:rounded-lg shadow-inner">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 sm:w-5 sm:h-5 text-white"
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
                        className="px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold
          text-white rounded-md sm:rounded-lg
          bg-gradient-to-r from-blue-600 to-emerald-600
          hover:from-blue-700 hover:to-emerald-700
          shadow-sm active:scale-95 transition-all duration-200"
                    >
                        Request
                    </button>
                </div>
            </div>
        </div>
    );


}
