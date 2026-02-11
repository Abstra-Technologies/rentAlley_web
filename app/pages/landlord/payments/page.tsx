"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useAuthStore from "@/zustand/authStore";
import PaymentList from "@/components/landlord/tenantPayments";
import {
    CreditCard,
    Search,
    Filter,
    Calendar,
    Wallet,
    Download,
} from "lucide-react";
import  PaymentSummaryGrid  from "@/components/landlord/analytics/PaymentSummaryGrid";
import Link from "next/link";
import PaymentReportModal from "@/components/landlord/payments/PaymentReportModal";
import axios from "axios";

/* =========================
   SKELETON
========================= */
const PaymentsSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16">
            <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
                <div>
                    <div className="h-7 bg-gray-200 rounded w-56 animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
                <div className="h-11 bg-gray-100 rounded-xl flex-1 animate-pulse" />
                <div className="h-11 bg-gray-100 rounded-xl w-40 animate-pulse" />
                <div className="h-11 bg-gray-100 rounded-xl w-40 animate-pulse" />
            </div>
        </div>
    </div>
);

interface Property {
    property_id: string;
    property_name: string;
}

export default function PaymentsPage() {
    const { user, loading, fetchSession } = useAuthStore();
    const landlord_id = user?.landlord_id;
    const [isDownloading, setIsDownloading] = useState(false);

    /* =========================
       STATE
    ========================== */
    const [search, setSearch] = useState("");
    const [paymentType, setPaymentType] = useState("all");
    const [dateRange, setDateRange] = useState("30");

    const [years, setYears] = useState<number[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);

    const [openReportModal, setOpenReportModal] = useState(false);

    /* =========================
       AUTH
    ========================== */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /* =========================
       FETCH YEARS
    ========================== */
    useEffect(() => {
        if (!landlord_id) return;

        fetch(`/api/landlord/payments/years?landlord_id=${landlord_id}`)
            .then((res) => res.json())
            .then((data) => {
                if (!data?.years) return;
                setYears(data.years);
            })
            .catch(() => setYears([]));
    }, [landlord_id]);

    /* =========================
       FETCH PROPERTIES
    ========================== */
    useEffect(() => {
        if (!landlord_id) return;

        fetch(`/api/landlord/${landlord_id}/properties`)
            .then((res) => res.json())
            .then((data) => setProperties(data.data || []))
            .catch(() => setProperties([]));
    }, [landlord_id]);


    const handleDownload = async ({
                                      property_id,
                                      year,
                                      month,
                                  }: {
        property_id: string | "all";
        year: string;
        month: string;
    }) => {
        try {
            setIsDownloading(true); // 🔥 START animation

            const res = await axios.get(
                "/api/landlord/reports/paymentList",
                {
                    params: {
                        landlord_id,
                        property_id: property_id !== "all" ? property_id : undefined,
                        year,
                        month,
                    },
                    responseType: "blob",
                }
            );

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `Payment_Report_${year}_${month}_${property_id}.pdf`;
            link.click();

            URL.revokeObjectURL(url);

            // ✅ small delay so user sees success before modal closes
            setTimeout(() => {
                setIsDownloading(false);
                setOpenReportModal(false); // 👈 close ONLY when done
            }, 600);
        } catch (error) {
            console.error("❌ Failed to download report:", error);
            setIsDownloading(false);
            alert("Failed to download report. Please try again.");
        }
    };




    if (loading || !landlord_id) {
        return <PaymentsSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ================= HEADER ================= */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16"
            >
                {/* Title */}
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Payment Transactions
                        </h1>
                        <p className="text-gray-600 text-sm">
                            Track rent collections and payouts
                        </p>
                    </div>
                </div>

                {/* ================= SUMMARY ================= */}
                <div className="mb-6 space-y-4">
                    <PaymentSummaryGrid landlord_id={landlord_id} />

                    {/* ACTION BUTTONS */}
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                        {/* Download Report */}
                        <button
                            onClick={() => setOpenReportModal(true)}
                            className="
                inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                bg-white border border-gray-200
                text-gray-700 text-sm font-semibold
                hover:bg-gray-50 transition-all
              "
                        >
                            <Download className="w-4 h-4 text-emerald-600" />
                            Download Report
                        </button>

                        {/* View Payouts */}
                        <Link href="/pages/landlord/payouts">
                            <button
                                className="
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                  bg-gradient-to-r from-emerald-500 to-blue-600
                  text-white text-sm font-semibold
                  shadow-md shadow-emerald-500/20
                  hover:from-emerald-600 hover:to-blue-700
                  hover:shadow-lg transition-all duration-200 active:scale-95
                "
                            >
                                <Wallet className="w-4 h-4" />
                                View Payouts / Disbursements
                            </button>
                        </Link>
                    </div>
                </div>

                {/* ================= FILTERS ================= */}
                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tenant, property, or unit"
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        />
                    </div>

                    {/* Payment Type */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <select
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value)}
                            className="appearance-none w-full lg:w-auto pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-sm cursor-pointer"
                        >
                            <option value="all">All Types</option>
                            <option value="monthly_billing">Monthly Billing</option>
                            <option value="rent">Rent</option>
                            <option value="utilities">Utilities</option>
                            <option value="security_deposit">Security Deposit</option>
                            <option value="advance_payment">Advance Payment</option>
                            <option value="penalty">Penalty</option>
                            <option value="reservation_fee">Reservation Fee</option>
                        </select>
                    </div>

                    {/* Date / Year */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="appearance-none w-full lg:w-auto pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white text-sm cursor-pointer"
                        >
                            <option value="all">All Transactions</option>
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
                </div>
            </motion.div>

            {/* ================= TABLE ================= */}
            <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                >
                    <PaymentList
                        landlord_id={landlord_id}
                        search={search}
                        paymentType={paymentType}
                        dateRange={dateRange}
                    />
                </motion.div>
            </div>

            {/* ================= DOWNLOAD REPORT MODAL ================= */}
            <PaymentReportModal
                open={openReportModal}
                onClose={() => setOpenReportModal(false)}
                landlord_id={String(landlord_id)}
                properties={properties}
                isDownloading={isDownloading}

                onDownload={handleDownload}
            />

        </div>
    );
}
