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
  const router = useRouter();

  useEffect(() => {
    if (!tenant_id) return;

    setLoading(true);
    setError(null);
    fetch(
      `/api/analytics/tenant/consolidated/totalPayables?tenant_id=${tenant_id}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch payables");
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        console.error(err);
        setError("Unable to load payables");
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

  if (!tenant_id) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <ExclamationCircleIcon className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-gray-600 text-center text-sm font-medium">
          Please log in to view payables
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-100 border-t-emerald-500 mb-2"></div>
        <p className="text-gray-500 text-sm font-medium">Loading payables...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="p-2 bg-red-100 rounded-full mb-2">
          <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-red-600 text-center text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!data || !data.details?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="p-3 bg-emerald-100 rounded-full mb-2">
          <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="text-emerald-700 text-center text-sm font-semibold">
          No outstanding payables
        </p>
        <p className="text-gray-500 text-center text-xs mt-1">
          All payments are settled
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* Total Summary Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 shadow-lg text-center text-white">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaMoneyBillWave className="w-5 h-5" />
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Total Payable
          </h2>
        </div>
        <p className="text-4xl sm:text-5xl font-bold">
          {formatPHP(data.total)}
        </p>
      </div>

      {/* Units List */}
      <div className="space-y-3">
        {data.details.map((unit) => (
          <div
            key={unit.unit_id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all duration-300 overflow-hidden"
          >
            {/* Header - Clickable */}
            <button
              onClick={() =>
                setExpandedUnit(
                  expandedUnit === unit.unit_id ? null : unit.unit_id
                )
              }
              className="w-full flex justify-between items-center p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2.5 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex-shrink-0">
                  <FaHome className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-left min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                    {unit.unit_name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {unit.property_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <div className="text-right">
                  <p className="text-sm sm:text-base font-bold text-gray-900">
                    {formatPHP(unit.total_due)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {unit.billing_details?.length || 0} bill
                    {(unit.billing_details?.length || 0) !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-gray-400">
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
              <div className="px-4 sm:px-5 py-4 border-t border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100 space-y-3">
                {unit.billing_details?.length > 0 ? (
                  unit.billing_details.map((bill) => (
                    <div
                      key={bill.billing_id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          Monthly Billing:{" "}
                          <span className="font-normal text-gray-600">
                            {formatDate(bill.billing_period)}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {formatDate(bill.due_date)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold text-gray-900">
                            {formatPHP(bill.total_amount_due)}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${
                              bill.status === "paid"
                                ? "bg-emerald-100 text-emerald-700"
                                : bill.status === "overdue"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {bill.status === "paid" && (
                              <CheckCircleIcon className="w-3 h-3" />
                            )}
                            {bill.status === "overdue" && (
                              <ExclamationCircleIcon className="w-3 h-3" />
                            )}
                            {bill.status.charAt(0).toUpperCase() +
                              bill.status.slice(1)}
                          </span>
                        </div>

                        {bill.status !== "paid" && (
                          <button
                            onClick={() => handlePayNow(bill)}
                            className="px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all transform hover:scale-[1.05] active:scale-[0.95]"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic text-center py-4">
                    No billing records found for this unit
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
