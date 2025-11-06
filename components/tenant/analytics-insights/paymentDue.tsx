import { useEffect, useState } from "react";
import axios from "axios";
import {
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface BillingSummary {
  total_due: number;
  paid_amount: number;
}

interface PaymentDueWidgetProps {
  agreement_id: number;
}

export default function PaymentDueWidget({
  agreement_id,
}: PaymentDueWidgetProps) {
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const response = await axios.get<{ billing: BillingSummary }>(
          `/api/tenant/dashboard/getPaymentDue?agreement_id=${agreement_id}`
        );
        setBilling(response.data.billing);
      } catch (err: any) {
        console.error("Error fetching billing data:", err);
        setError(
          err.response?.data?.message || "Failed to fetch billing data."
        );
      } finally {
        setLoading(false);
      }
    }

    if (agreement_id) fetchBilling();
  }, [agreement_id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
        <p className="text-red-700 text-sm font-semibold">{error}</p>
      </div>
    );
  }

  if (!billing)
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">
          No billing information available.
        </p>
      </div>
    );

  const { total_due, paid_amount } = billing;
  const remainingAmount = Math.max(total_due - paid_amount, 0);
  const progressPercent = total_due ? (paid_amount / total_due) * 100 : 0;
  const isPaid = remainingAmount === 0;
  const isOverdue = remainingAmount > 0 && remainingAmount > total_due * 0.5;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl">
          <CreditCardIcon className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Payment Due</h3>
          <p className="text-xs text-gray-600">Outstanding balance</p>
        </div>
      </div>

      {/* Amount Display */}
      <div
        className={`rounded-2xl p-6 mb-6 border-2 ${
          isPaid
            ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300"
            : isOverdue
            ? "bg-gradient-to-br from-red-50 to-red-100 border-red-300"
            : "bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-300"
        }`}
      >
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-600 mb-2">
            Amount Remaining
          </p>
          <p
            className={`text-4xl sm:text-5xl font-bold mb-2 ${
              isPaid
                ? "text-emerald-600"
                : isOverdue
                ? "text-red-600"
                : "bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent"
            }`}
          >
            ₱{remainingAmount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            of{" "}
            <span className="font-semibold">₱{total_due.toLocaleString()}</span>{" "}
            total
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-700">Payment Progress</span>
          <span
            className={`font-bold ${
              isPaid
                ? "text-emerald-600"
                : isOverdue
                ? "text-red-600"
                : "text-blue-600"
            }`}
          >
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isPaid
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                : isOverdue
                ? "bg-gradient-to-r from-red-500 to-orange-500"
                : "bg-gradient-to-r from-blue-500 to-emerald-500"
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>₱{paid_amount.toLocaleString()} paid</span>
          <span>₱{remainingAmount.toLocaleString()} due</span>
        </div>
      </div>

      {/* Status Badge */}
      {isPaid && (
        <div className="mt-auto p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-emerald-900">Fully Paid</p>
            <p className="text-xs text-emerald-700">All payments complete</p>
          </div>
        </div>
      )}

      {isOverdue && (
        <div className="mt-auto p-4 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-amber-900">Action Needed</p>
            <p className="text-xs text-amber-700">Large balance remaining</p>
          </div>
        </div>
      )}
    </div>
  );
}
