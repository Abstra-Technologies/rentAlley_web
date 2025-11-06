"use client";

import { formatDate } from "@/utils/formatter/formatters";
import { useEffect, useState } from "react";
import {
  FaHome,
  FaMoneyBillWave,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface BillingDetail {
  billing_id: number;
  billing_period: string;
  total_amount_due: number | null;
  status: string;
  due_date: string;
}

interface UnitPayable {
  unit_id: number;
  unit_name: string;
  property_name: string;
  rent_amount: number | null;
  security_deposit_amount: number | null;
  advance_payment_amount: number | null;
  total_due: number | null;
  billing_details: BillingDetail[];
}

interface PayablesResponse {
  total: number;
  details: UnitPayable[];
}

export default function TenantPayables({
  tenant_id,
}: {
  tenant_id: number | undefined;
}) {
  const [data, setData] = useState<PayablesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const itemsPerPage = 3;

  useEffect(() => {
    if (!tenant_id) return;

    setLoading(true);
    setError(null);
    fetch(
      `/api/analytics/tenant/consolidated/totalPayables?tenant_id=${tenant_id}`
    )
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.message || "Failed to fetch payables");
          });
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        console.error("Payables error:", err);
        setError(err.message || "Unable to load payables");
      })
      .finally(() => setLoading(false));
  }, [tenant_id]);

  const formatPHP = (value: number | null | undefined): string =>
    `₱${(Number(value) || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handlePayNow = (bill: BillingDetail) => {
    router.push(`/pages/tenant/pay/${bill.billing_id}`);
  };

  // Pagination logic
  const paginatedUnits = data?.details?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil((data?.details?.length || 0) / itemsPerPage);

  if (!tenant_id) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
          <ExclamationCircleIcon className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-gray-600 text-center text-sm font-semibold">
          Please log in to view payables
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-200"></div>
          <div className="absolute inset-0 animate-spin rounded-full h-10 w-10 border-3 border-transparent border-t-red-500"></div>
        </div>
        <p className="text-gray-500 text-sm font-medium mt-3">
          Loading payables...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
          <ExclamationCircleIcon className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-red-600 text-center text-sm font-semibold">
          {error}
        </p>
        <p className="text-gray-500 text-xs mt-1">Please try again</p>
      </div>
    );
  }

  if (!data || !data.details?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
          <CheckCircleIcon className="w-7 h-7 text-emerald-600" />
        </div>
        <p className="text-emerald-700 text-center text-sm font-bold">
          No Outstanding Payables
        </p>
        <p className="text-gray-500 text-center text-xs mt-1">
          All payments are settled
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <FaMoneyBillWave className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Total Payables
          </h3>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold text-gray-900 tabular-nums leading-none">
            {formatPHP(data.total)}
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {data.details.length} {data.details.length === 1 ? "unit" : "units"}{" "}
          with outstanding balance
        </p>
      </div>

      {/* Units List - Fixed height with internal scroll */}
      <div className="flex-1 space-y-3 min-h-0">
        {paginatedUnits?.map((unit) => (
          <div
            key={unit.unit_id}
            className="bg-gradient-to-r from-rose-50 to-red-50 rounded-xl border border-red-200 overflow-hidden hover:shadow-md transition-all duration-300"
          >
            {/* Header - Clickable */}
            <button
              onClick={() =>
                setExpandedUnit(
                  expandedUnit === unit.unit_id ? null : unit.unit_id
                )
              }
              className="w-full flex justify-between items-center p-4 cursor-pointer hover:bg-red-50/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <FaHome className="w-4 h-4 text-red-600" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {unit.unit_name}
                  </h4>
                  <p className="text-xs text-gray-600 truncate">
                    {unit.property_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <div className="text-right">
                  <p className="text-base font-bold text-gray-900 tabular-nums">
                    {formatPHP(unit.total_due)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {unit.billing_details?.length || 0}{" "}
                    {(unit.billing_details?.length || 0) === 1
                      ? "bill"
                      : "bills"}
                  </p>
                </div>
                <div className="text-gray-500">
                  {expandedUnit === unit.unit_id ? (
                    <FaChevronUp className="w-4 h-4" />
                  ) : (
                    <FaChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedUnit === unit.unit_id && (
              <div className="px-4 pb-4 border-t border-red-100 bg-white space-y-2">
                {unit.billing_details?.length > 0 ? (
                  unit.billing_details.map((bill) => (
                    <div
                      key={bill.billing_id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {formatDate(bill.billing_period)}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Due: {formatDate(bill.billing_due_date)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 tabular-nums">
                            {formatPHP(bill.total_amount_due)}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                              bill.status === "paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : bill.status === "overdue"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {bill.status.charAt(0).toUpperCase() +
                              bill.status.slice(1)}
                          </span>
                        </div>

                        {bill.status !== "paid" && (
                          <button
                            onClick={() => handlePayNow(bill)}
                            className="px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm hover:shadow-md transition-all"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic text-center py-4">
                    No billing records
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Prev
          </button>
          <span className="text-xs font-medium text-gray-600">
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            Next
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
