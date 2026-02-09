"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useAuthStore from "@/zustand/authStore";
import PaymentList from "@/components/landlord/tenantPayments";
import { CreditCard, Search, Filter, Calendar } from "lucide-react";
import { PaymentSummaryGrid } from "@/components/landlord/analytics/PaymentSummaryGrid";
import Link from "next/link";
import { Wallet } from "lucide-react";

// Skeleton Component
const PaymentsSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header Skeleton */}
    <div className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
        <div>
          <div className="h-7 bg-gray-200 rounded w-56 animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
        </div>
      </div>
      {/* Summary Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
      {/* Filter Skeleton */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="h-11 bg-gray-100 rounded-xl flex-1 animate-pulse" />
        <div className="h-11 bg-gray-100 rounded-xl w-40 animate-pulse" />
        <div className="h-11 bg-gray-100 rounded-xl w-40 animate-pulse" />
      </div>
    </div>
    {/* Table Skeleton */}
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 pt-5">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="hidden sm:grid sm:grid-cols-7 bg-gray-50 border-b border-gray-200 px-6 py-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 rounded w-16 animate-pulse"
            />
          ))}
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="h-5 bg-gray-200 rounded w-24" />
                <div className="flex-1 h-5 bg-gray-200 rounded" />
                <div className="h-5 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function PaymentsPage() {
  const { user, loading, fetchSession } = useAuthStore();
  const landlord_id = user?.landlord_id;

  /* -----------------------
       FILTER STATE
    ----------------------- */
  const [search, setSearch] = useState("");
  const [paymentType, setPaymentType] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    if (!user) fetchSession();
  }, [user, fetchSession]);

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
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
        </div>

        {/* ================= SUMMARY ================= */}
          {/* ================= SUMMARY ================= */}
          <div className="mb-6 space-y-4">
              <PaymentSummaryGrid landlord_id={landlord_id} />

              {/* View Payouts Button */}
              <div className="flex justify-end">
                  <Link href="/pages/landlord/payouts">
                      <button
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                   bg-gradient-to-r from-emerald-500 to-blue-600
                   text-white text-sm font-semibold
                   shadow-md shadow-emerald-500/20
                   hover:from-emerald-600 hover:to-blue-700
                   hover:shadow-lg transition-all duration-200 active:scale-95"
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
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
            />
          </div>

          {/* Payment Type */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="appearance-none w-full lg:w-auto pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm cursor-pointer"
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
                  className="appearance-none w-full lg:w-auto pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm cursor-pointer"
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
          transition={{ delay: 0.1 }}
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
    </div>
  );
}
