"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import PaymentList from "@/components/landlord/tenantPayments";
import { CreditCard } from "lucide-react";
import { PaymentSummaryGrid } from "@/components/landlord/analytics/PaymentSummaryGrid";

export default function PaymentsPage() {
    const { user, admin, loading, fetchSession } = useAuthStore();
    const landlord_id = user?.landlord_id;

    /* -----------------------
       FILTER STATE
    ----------------------- */
    const [search, setSearch] = useState("");
    const [paymentType, setPaymentType] = useState("all");
    const [dateRange, setDateRange] = useState("30");
    const [years, setYears] = useState<number[]>([]);

    useEffect(() => {
        if (!user && !admin) fetchSession();
    }, [user, admin]);

    /* -----------------------
       FETCH AVAILABLE YEARS
    ----------------------- */
    useEffect(() => {
        if (!landlord_id) return;

        fetch(`/api/landlord/payments/years?landlord_id=${landlord_id}`)
            .then((res) => res.json())
            .then((data) => {
                if (!data?.firstYear) return;

                const list: number[] = [];
                for (let y = data.currentYear; y >= data.firstYear; y--) {
                    list.push(y);
                }

                setYears(list);
            })
            .catch(() => setYears([]));
    }, [landlord_id]);

    if (loading || !landlord_id) return null;

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-6">
            {/* ================= HEADER ================= */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <CreditCard className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Payments & Disbursements
                    </h1>
                    <p className="text-sm text-gray-500">
                        Track rent collections and payouts
                    </p>
                </div>
            </div>

            {/* ================= SUMMARY ================= */}
            <PaymentSummaryGrid landlord_id={landlord_id} />

            {/* ================= FILTERS ================= */}
            <div className="bg-white rounded-xl border p-4 mb-4 flex flex-col md:flex-row gap-3">
                {/* Search */}
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tenant, property, or unit"
                    className="flex-1 border rounded-lg px-4 py-2 text-sm
                     focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                {/* Payment Type */}
                <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                >
                    <option value="all">All Types</option>
                    <option value="rent">Rent</option>
                    <option value="utilities">Utilities</option>
                    <option value="security_deposit">Security Deposit</option>
                    <option value="advance_payment">Advance Payment</option>
                    <option value="penalty">Penalty</option>
                    <option value="reservation_fee">Reservation Fee</option>
                </select>

                {/* Date / Year */}
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                >
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                    <option value="month">This Month</option>

                    {years.length > 0 && (
                        <optgroup label="By Year">
                            {years.map((year) => (
                                <option key={year} value={`year:${year}`}>
                                    {year}
                                </option>
                            ))}
                        </optgroup>
                    )}
                </select>
            </div>

            {/* ================= TABLE ================= */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <PaymentList
                    landlord_id={landlord_id}
                    search={search}
                    paymentType={paymentType}
                    dateRange={dateRange}
                />
            </div>
        </div>
    );
}
