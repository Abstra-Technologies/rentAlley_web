"use client";

import useSWR from "swr";
import { useState } from "react";
import axios from "axios";
import { Banknote, Search, Send } from "lucide-react";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PaymentsListPage() {
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDisbursing, setIsDisbursing] = useState(false);
    const router = useRouter();

    const { data, error, isLoading, mutate } = useSWR(
        "/api/systemadmin/payouts/getListofPayments",
        fetcher
    );

    const payments = data?.payments || [];

    /* ----------------------------
       FILTER + SEARCH
    ----------------------------- */
    const filtered = payments.filter((p: any) =>
        `${p.landlord_name} ${p.payment_id}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    /* ----------------------------
       STATUS COLORS
    ----------------------------- */
    const payoutColors: Record<string, string> = {
        unpaid: "bg-yellow-100 text-yellow-700 border-yellow-300",
        in_payout: "bg-blue-100 text-blue-700 border-blue-300",
        paid: "bg-green-100 text-green-700 border-green-300",
    };

    /* ----------------------------
       SELECTION
    ----------------------------- */
    const toggleSelect = (payment: any) => {
        if (
            payment.payment_status !== "confirmed" ||
            payment.payout_status !== "unpaid"
        )
            return;

        setSelectedIds((prev) =>
            prev.includes(payment.payment_id)
                ? prev.filter((id) => id !== payment.payment_id)
                : [...prev, payment.payment_id]
        );
    };

    /* ----------------------------
       MARK AS IN PAYOUT
    ----------------------------- */
    const handleProcessPayout = async () => {
        if (selectedIds.length === 0) {
            alert("No payments selected.");
            return;
        }

        await axios.put("/api/systemadmin/payouts/updateStatus", {
            payment_ids: selectedIds,
            new_status: "in_payout",
        });

        alert("Payments marked as in payout.");
        setSelectedIds([]);
        mutate();
    };

    /* ----------------------------
       DISBURSE PAYMENT
    ----------------------------- */
    const handleDisburseNow = () => {
        if (selectedIds.length === 0) {
            alert("No payments selected for disbursement.");
            return;
        }

        router.push(
            `/pages/system_admin/payouts/review?payment_ids=${selectedIds.join(",")}`
        );
    };

    /* ============================
       UI
    ============================= */
    return (
        <div className="w-full">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 p-2 rounded-lg shadow-md">
                    <Banknote className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Landlord Payouts
                </h1>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-3 mb-4">
                <button
                    onClick={handleProcessPayout}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                >
                    Mark as In Payout
                </button>

                <button
                    onClick={handleDisburseNow}
                    disabled={isDisbursing}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                    {isDisbursing ? "Disbursing..." : "Disburse Payment Now"}
                </button>
            </div>

            {/* SEARCH */}
            <div className="flex items-center bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm w-full sm:w-80 mb-6">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search payments..."
                    className="ml-3 w-full outline-none text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* STATES */}
            {isLoading && (
                <div className="bg-white p-6 rounded-xl shadow text-center">
                    Loading payments…
                </div>
            )}

            {error && (
                <div className="bg-white p-6 rounded-xl shadow text-center text-red-500">
                    Failed to load payments.
                </div>
            )}

            {/* TABLE */}
            {!isLoading && !error && (
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3">
                                <input
                                    type="checkbox"
                                    onChange={(e) =>
                                        setSelectedIds(
                                            e.target.checked
                                                ? filtered
                                                    .filter(
                                                        (p: any) =>
                                                            p.payment_status === "confirmed" &&
                                                            p.payout_status === "unpaid"
                                                    )
                                                    .map((p: any) => p.payment_id)
                                                : []
                                        )
                                    }
                                />
                            </th>
                            <th className="px-6 py-3">Payment ID</th>
                            <th className="px-6 py-3">Landlord</th>
                            <th className="px-6 py-3">Gross</th>
                            <th className="px-6 py-3">Gateway Fee</th>
                            <th className="px-6 py-3">Net Amount</th>
                            <th className="px-6 py-3">Reference</th>
                            <th className="px-6 py-3">Payout Status</th>
                            <th className="px-6 py-3">Date</th>
                        </tr>
                        </thead>

                        <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center py-6 text-gray-500">
                                    No payments found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((p: any) => {
                                const selectable =
                                    p.payment_status === "confirmed" &&
                                    p.payout_status === "unpaid";

                                return (
                                    <tr
                                        key={p.payment_id}
                                        className="border-b hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-3">
                                            <input
                                                type="checkbox"
                                                disabled={!selectable}
                                                checked={selectedIds.includes(p.payment_id)}
                                                onChange={() => toggleSelect(p)}
                                            />
                                        </td>
                                        <td className="px-6 py-3">{p.payment_id}</td>
                                        <td className="px-6 py-3">{p.landlord_name}</td>

                                        {/* GROSS */}
                                        <td className="px-6 py-3 font-semibold">
                                            ₱{Number(p.amount).toLocaleString()}
                                        </td>

                                        {/* GATEWAY FEE */}
                                        <td className="px-6 py-3 text-red-600">
                                            ₱{Number(p.gateway_fee ?? 0).toLocaleString()}
                                        </td>

                                        {/* NET AMOUNT */}
                                        <td className="px-6 py-3 font-semibold text-emerald-700">
                                            ₱{Number(p.net_amount ?? p.amount).toLocaleString()}
                                        </td>

                                        <td className="px-6 py-3">
                                            {p.receipt_reference || "—"}
                                        </td>

                                        <td className="px-6 py-3">
                        <span
                            className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                                payoutColors[p.payout_status]
                            }`}
                        >
                          {p.payout_status}
                        </span>
                                        </td>

                                        <td className="px-6 py-3">{p.date}</td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
