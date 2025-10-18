import { useEffect, useState } from "react";
import axios from "axios";

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
      <div className="animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-28 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
        <p className="text-red-700 text-xs sm:text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!billing)
    return (
      <p className="text-gray-500 text-sm">No billing information available.</p>
    );

  const { total_due, paid_amount } = billing;
  const remainingAmount = Math.max(total_due - paid_amount, 0);
  const progressPercent = total_due ? (paid_amount / total_due) * 100 : 0;
  const isPaid = remainingAmount === 0;
  const isOverdue = remainingAmount > 0 && remainingAmount > total_due * 0.5;

  return (
    <div className="flex flex-col h-full">
      {/* Header - Mobile optimized */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-lg">💳</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Payment Due
          </h3>
        </div>
        <p className="text-xs text-gray-600 ml-9 sm:ml-10">
          Outstanding amount
        </p>
      </div>

      {/* Amount Display - Large and readable on mobile */}
      <div className="mb-4 p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl sm:rounded-2xl border border-blue-100">
        <p className="text-xs text-gray-600 mb-2 sm:mb-3">Amount Remaining</p>
        <div className="flex flex-col gap-1 sm:gap-2">
          <span className="text-3xl sm:text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text leading-tight">
            ₱{remainingAmount.toLocaleString()}
          </span>
          <span className="text-xs sm:text-sm text-gray-600">
            of ₱{total_due.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Progress Bar - Touch-friendly */}
      <div className="space-y-2 mb-4">
        <div className="w-full bg-gray-200 rounded-full h-3 sm:h-3.5 overflow-hidden">
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
        <div className="flex justify-between text-xs sm:text-xs text-gray-600 px-1">
          <span>₱{paid_amount.toLocaleString()} paid</span>
          <span
            className={`font-semibold ${
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
      </div>

      {/* Status Badge - Full width on mobile */}
      {isPaid && (
        <div className="mt-auto pt-3 border-t border-blue-100">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
            <svg
              className="w-4 h-4 text-emerald-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs sm:text-sm font-semibold text-emerald-700">
              Fully Paid
            </span>
          </div>
        </div>
      )}

      {isOverdue && (
        <div className="mt-auto pt-3 border-t border-blue-100">
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
            <svg
              className="w-4 h-4 text-orange-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs sm:text-sm font-semibold text-orange-700">
              Action Needed
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
