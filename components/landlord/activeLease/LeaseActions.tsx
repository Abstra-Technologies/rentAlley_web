"use client";
import Link from "next/link";
import Swal from "sweetalert2";

export default function LeaseActions({
                                         lease,
                                         leaseMode,
                                         setLeaseMode,
                                         unitId,
                                         startDate,
                                         endDate,
                                         setStartDate,
                                         setEndDate,
                                         handleGenerateLease,
                                         handleUploadLease,
                                         handleSaveDates,
                                         handleTerminateLease,
                                     }) {

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Lease Agreement</h2>

            {/* ✅ If existing lease document */}
            {lease?.agreement_url ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 font-semibold mb-1">Existing Lease Document</p>
                    <Link
                        href={lease.agreement_url}
                        target="_blank"
                        className="text-blue-600 underline text-sm"
                    >
                        View Document
                    </Link>

                    <button
                        onClick={handleTerminateLease}
                        className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold text-sm"
                    >
                        Terminate Lease
                    </button>
                </div>
            ) : (
                <>
                    {/* 🔘 Lease Mode Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <button
                            onClick={() => setLeaseMode("upload")}
                            className={`flex-1 py-2 rounded-lg border ${
                                leaseMode === "upload"
                                    ? "bg-green-600 text-white border-green-600"
                                    : "border-gray-300 hover:bg-gray-100"
                            }`}
                        >
                            Upload Lease
                        </button>
                        <button
                            onClick={() => setLeaseMode("continue")}
                            className={`flex-1 py-2 rounded-lg border ${
                                leaseMode === "continue"
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "border-gray-300 hover:bg-gray-100"
                            }`}
                        >
                            Continue Without Agreement
                        </button>
                    </div>

                    {/* 🗓️ Show Date Fields ONLY when “Continue Without Lease” */}
                    {leaseMode === "continue" && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                    />
                                </div>
                            </div>

                            {/* 🚀 Save Button with Modal Prompt */}
                            <button
                                onClick={handleSaveDates}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
                            >
                                Continue Without Agreement
                            </button>
                        </>
                    )}

                    {leaseMode === "upload" && (
                        <button
                            onClick={handleUploadLease}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
                        >
                            Upload Lease Document
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
