"use client";

import useSWR from "swr";
import { useState } from "react";
import axios from "axios";
import { Banknote, Search, Filter } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PaymentsListPage() {
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const { data, error, isLoading } = useSWR(
        "/api/systemadmin/payouts/getListofPayments",
        fetcher
    );

    const payments = data?.payments || [];

    // Search filter
    const filtered = payments.filter((p: any) =>
        `${p.landlord_name} ${p.payment_id}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const payoutColors: any = {
        unpaid: "bg-yellow-100 text-yellow-700 border-yellow-300",
        in_payout: "bg-blue-100 text-blue-700 border-blue-300",
        paid: "bg-green-100 text-green-700 border-green-300",
    };

    // -----------------------------
    // SELECT PAYMENT FOR PROCESSING
    // -----------------------------
    const toggleSelect = (payment_id: string) => {
        setSelectedIds((prev) =>
            prev.includes(payment_id)
                ? prev.filter((id) => id !== payment_id)
                : [...prev, payment_id]
        );
    };

    const handleProcessPayout = async () => {
        if (selectedIds.length === 0) {
            alert("No payout selected.");
            return;
        }

        try {
            const res = await axios.put("/api/systemadmin/payouts/updateStatus", {
                payment_ids: selectedIds,
                new_status: "in_payout",
            });

            alert("Payouts updated successfully!");

            // Refresh table
            window.location.reload();
        } catch (err) {
            console.error("Payout update failed", err);
            alert("Failed to update payouts.");
        }
    };

    return (
        <div className="w-full">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 p-2 rounded-lg shadow-md">
                    <Banknote className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Payments List</h1>
            </div>

            {/* Process Selected Button */}
            <button
                onClick={handleProcessPayout}
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
                Process Selected Payouts
            </button>

            {/* SEARCH + FILTER */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-6">
                <div className="flex items-center bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm w-full sm:w-80">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search payments..."
                        className="ml-3 w-full outline-none text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition shadow-sm">
                    <Filter className="w-5 h-5" />
                    Filters
                </button>
            </div>

            {/* LOADING STATE */}
            {isLoading && (
                <div className="bg-white p-6 rounded-xl shadow text-center">
                    <p className="text-gray-500">Loading payments...</p>
                </div>
            )}

            {/* ERROR STATE */}
            {error && (
                <div className="bg-white p-6 rounded-xl shadow text-center">
                    <p className="text-red-500 font-medium">Failed to load payments.</p>
                </div>
            )}

            {/* TABLE */}
            {!isLoading && !error && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <table className="w-full table-auto text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">
                                <input
                                    type="checkbox"
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedIds(filtered.map((p: any) => p.payment_id));
                                        } else {
                                            setSelectedIds([]);
                                        }
                                    }}
                                />
                            </th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                                Payment ID
                            </th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                                Landlord
                            </th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                                Reference No.
                            </th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                                Payout Status
                            </th>
                            <th className="px-6 py-3 text-sm font-semibold text-gray-700">
                                Date
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-6 text-gray-500 font-medium">
                                    No payments found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((p: any) => (
                                <tr key={p.payment_id} className="border-b hover:bg-gray-50 transition text-sm">
                                    <td className="px-6 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(p.payment_id)}
                                            onChange={() => toggleSelect(p.payment_id)}
                                        />
                                    </td>
                                    <td className="px-6 py-3">{p.payment_id}</td>
                                    <td className="px-6 py-3">{p.landlord_name}</td>
                                    <td className="px-6 py-3 font-semibold text-blue-700">
                                        ₱{Number(p.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3">{p.receipt_reference || "—"}</td>
                                    <td className="px-6 py-3">
                                            <span
                                                className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                                                    payoutColors[p.payout_status] ||
                                                    "bg-gray-100 text-gray-700 border-gray-300"
                                                }`}
                                            >
                                                {p.payout_status.charAt(0).toUpperCase() + p.payout_status.slice(1)}
                                            </span>
                                    </td>
                                    <td className="px-6 py-3">{p.date}</td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
