"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

interface Payment {
    payment_id: number;
    tenant_name: string;
    unit_name: string;
    payment_type: string;
    amount_paid: number;
    payment_method_id: string;
    payment_status: string;
    payment_date: string;
}

/* =========================
   COMPONENT
========================= */
export default function PropertyPaymentsStackedList({
                                                        payments,
                                                        loading,
                                                    }: {
    payments: Payment[];
    loading: boolean;
}) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    /* =========================
       FILTERED DATA
    ========================= */
    const filteredPayments = useMemo(() => {
        return payments.filter((p) => {
            const matchesSearch =
                p.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
                p.unit_name.toLowerCase().includes(search.toLowerCase()) ||
                p.payment_type.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                !statusFilter || p.payment_status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [payments, search, statusFilter]);

    /* =========================
       UI
    ========================= */
    return (
        <div className="space-y-3">
            {/* SEARCH + FILTER */}
            <div className="flex gap-2">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg
                     focus:ring-emerald-500 focus:border-emerald-500"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2 py-2 text-sm border border-gray-300 rounded-lg"
                >
                    <option value="">All</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {/* LIST */}
            {loading && (
                <div className="text-center text-gray-500 py-4 text-sm">
                    Loading payments…
                </div>
            )}

            {!loading && filteredPayments.length === 0 && (
                <div className="text-center text-gray-500 py-4 text-sm">
                    No matching payments
                </div>
            )}

            {!loading &&
                filteredPayments.map((p) => (
                    <div
                        key={p.payment_id}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm"
                    >
                        {/* TOP ROW */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {p.tenant_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Unit {p.unit_name}
                                </p>
                            </div>

                            <span
                                className={`px-2 py-[2px] rounded-full text-[11px] font-medium ${
                                    p.payment_status === "confirmed"
                                        ? "bg-green-100 text-green-700"
                                        : p.payment_status === "failed"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-yellow-100 text-yellow-700"
                                }`}
                            >
                {p.payment_status}
              </span>
                        </div>

                        {/* DETAILS */}
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div>
                                <span className="text-gray-500">Amount</span>
                                <p className="font-semibold">
                                    {formatCurrency(p.amount_paid)}
                                </p>
                            </div>

                            <div>
                                <span className="text-gray-500">Paid</span>
                                <p>{formatDate(p.payment_date)}</p>
                            </div>

                            <div>
                                <span className="text-gray-500">Type</span>
                                <p className="capitalize">
                                    {p.payment_type.replace("_", " ")}
                                </p>
                            </div>

                            <div>
                                <span className="text-gray-500">Method</span>
                                <p className="uppercase text-[11px]">
                                    {p.payment_method_id}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
        </div>
    );
}
