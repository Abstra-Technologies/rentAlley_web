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
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-red-100 border-t-red-500 mb-2"></div>
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
    <div className="w-full h-full flex flex-col">
      {/* Header with icon - Consistent with ActiveRentals */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center flex-shrink-0">
            <FaMoneyBillWave className="w-4 h-4 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Total Payables
          </h3>
        </div>
        <p className="text-xs text-gray-600 ml-10">Outstanding balances</p>
      </div>

      {/* Total Amount Display - Compact version */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 shadow-sm text-center text-white mb-4">
        <p className="text-xs font-semibold tracking-wide uppercase opacity-90 mb-1">
          Amount Due
        </p>
        <p className="text-3xl font-bold">{formatPHP(data.total)}</p>
      </div>

      {/* Units List - Scrollable */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
        {data.details.map((unit) => (
          <div
            key={unit.unit_id}
            className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 hover:border-red-200 transition-all overflow-hidden"
          >
            {/* Header - Clickable */}
            <button
              onClick={() =>
                setExpandedUnit(
                  expandedUnit === unit.unit_id ? null : unit.unit_id
                )
              }
              className="w-full flex justify-between items-center p-3 cursor-pointer hover:bg-red-50/50 transition-colors"
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="p-1.5 bg-white rounded-lg flex-shrink-0">
                  <FaHome className="w-3.5 h-3.5 text-red-600" />
                </div>
                <div className="text-left min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {unit.unit_name}
                  </h4>
                  <p className="text-xs text-gray-600 truncate">
                    {unit.property_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {formatPHP(unit.total_due)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {unit.billing_details?.length || 0} bill
                    {(unit.billing_details?.length || 0) !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-gray-500">
                  {expandedUnit === unit.unit_id ? (
                    <FaChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <FaChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedUnit === unit.unit_id && (
              <div className="px-3 py-3 border-t border-red-100 bg-white space-y-2">
                {unit.billing_details?.length > 0 ? (
                  unit.billing_details.map((bill) => (
                    <div
                      key={bill.billing_id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {formatDate(bill.billing_period)}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Due: {formatDate(bill.due_date)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
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
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-sm hover:shadow transition-all"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic text-center py-3">
                    No billing records
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
