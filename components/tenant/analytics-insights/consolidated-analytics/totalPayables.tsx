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
  total_due: number | null;
  billing_details: BillingDetail[];
}

interface PayablesResponse {
  total: number;
  details: UnitPayable[];
}

export default function TenantPayables({ tenant_id }: { tenant_id: number | undefined }) {
  const [data, setData] = useState<PayablesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!tenant_id) return;

    setLoading(true);
    fetch(`/api/analytics/tenant/consolidated/totalPayables?tenant_id=${tenant_id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch payables");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message || "Unable to load payables"))
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

  /* ===========================
      STATE HANDLING (EMPTY/ERROR)
     =========================== */
  if (!tenant_id)
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <ExclamationCircleIcon className="icon-responsive text-gray-400 mb-2" />
        <p className="text-responsive text-gray-600 text-center font-medium">
          Please log in to view your payables.
        </p>
      </div>
    );

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full"></div>
        <p className="text-responsive text-gray-500 mt-2">Loading payables...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <ExclamationCircleIcon className="icon-responsive text-red-500 mb-2" />
        <p className="text-red-600 font-semibold text-responsive">{error}</p>
        <p className="text-xs text-gray-500 mt-1">Please try again later.</p>
      </div>
    );

  if (!data || !data.details?.length)
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <CheckCircleIcon className="icon-responsive text-emerald-600 mb-2" />
        <p className="text-emerald-700 font-semibold text-responsive">
          No Outstanding Payables
        </p>
        <p className="text-xs text-gray-500">All payments are settled.</p>
      </div>
    );

  /* ===========================
      MAIN UI
     =========================== */

  return (
    <div className="w-full flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-xl shadow-sm border border-emerald-100">

      {/* HEADER — compact */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full text-left px-4 py-4 flex justify-between items-center 
          rounded-t-xl border-b border-emerald-600 text-white
          bg-gradient-to-r from-emerald-700 to-teal-600
          transition-all duration-300`}
      >
        {/* LEFT — TITLE + AMOUNT */}
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <FaMoneyBillWave className="icon-responsive text-white opacity-80" />
            <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wide opacity-90">
              Total Payables
            </h3>
          </div>

          <p className="text-2xl sm:text-3xl font-extrabold text-white leading-none drop-shadow-sm">
            {formatPHP(data.total)}
          </p>

          <p className="text-[10px] sm:text-xs text-emerald-100 mt-1">
            {data.details.length} {data.details.length === 1 ? "unit" : "units"} with balance
          </p>
        </div>

        {/* RIGHT — CHEVRON */}
        <FaChevronDown
          className={`icon-responsive text-white transition-transform duration-300 ${
            isExpanded ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* EXPANDABLE LIST */}
      <div
        className={`transition-all duration-500 overflow-hidden ${
          isExpanded ? "max-h-[1500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-3 sm:px-5 pb-5 space-y-3 bg-white/60 backdrop-blur-sm rounded-b-xl border-t border-emerald-100">

          {data.details.map((unit) => (
            <div
              key={unit.unit_id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              {/* UNIT HEADER — compact */}
              <button
                onClick={() =>
                  setExpandedUnit(
                    expandedUnit === unit.unit_id ? null : unit.unit_id
                  )
                }
                className="w-full flex justify-between items-center p-3 sm:p-4 text-left"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 flex items-center justify-center rounded-lg">
                    <FaHome className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">
                      {unit.unit_name}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate">
                      {unit.property_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-3">
                  <p className="text-sm font-bold text-gray-900">
                    {formatPHP(unit.total_due)}
                  </p>
                  {expandedUnit === unit.unit_id ? (
                    <FaChevronUp className="w-3 h-3 text-gray-500" />
                  ) : (
                    <FaChevronDown className="w-3 h-3 text-gray-500" />
                  )}
                </div>
              </button>

              {/* BILLING LIST */}
              <div
                className={`transition-all overflow-hidden ${
                  expandedUnit === unit.unit_id
                    ? "max-h-[800px] opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-3 sm:p-4 border-t border-emerald-100 bg-gradient-to-br from-gray-50 to-emerald-50 space-y-2 rounded-b-lg">
                  {unit.billing_details.length ? (
                    unit.billing_details.map((bill) => (
                      <div
                        key={bill.billing_id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white border border-gray-200 rounded-md p-2.5 hover:border-emerald-300 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-xs">
                            {formatDate(bill.billing_period)}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Due: {formatDate(bill.due_date)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 text-xs">
                              {formatPHP(bill.total_amount_due)}
                            </p>
                            <span
                              className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
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
                              className="px-3 py-1.5 text-[10px] font-semibold rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-sm"
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-gray-500 italic text-center py-1">
                      No billing records available.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
