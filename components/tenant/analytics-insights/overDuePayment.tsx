import { useEffect, useState } from "react";
import axios from "axios";

interface OverduePayment {
  total_overdue: number;
  overdue_count: number;
}

interface OverduePaymentWidgetProps {
  agreement_id: number;
}

export default function OverduePaymentWidget({
  agreement_id,
}: OverduePaymentWidgetProps) {
  const [overdue, setOverdue] = useState<OverduePayment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverdue() {
      try {
        const response = await axios.get<{ overdue: OverduePayment }>(
          `/api/tenant/dashboard/getOverDuePayments?agreement_id=${agreement_id}`
        );
        setOverdue(response.data.overdue);
      } catch (err: any) {
        console.error("Error fetching overdue payments:", err);
        setError(
          err.response?.data?.message || "Failed to fetch overdue payments."
        );
      } finally {
        setLoading(false);
      }
    }

    if (agreement_id) fetchOverdue();
  }, [agreement_id]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-28 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-24"></div>
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

  if (!overdue)
    return (
      <p className="text-gray-500 text-sm">No overdue information available.</p>
    );

  const hasOverdue = overdue.total_overdue > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header - Mobile optimized */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              hasOverdue
                ? "bg-gradient-to-br from-red-100 to-orange-100"
                : "bg-gradient-to-br from-emerald-100 to-green-100"
            }`}
          >
            <span className="text-base sm:text-lg">
              {hasOverdue ? "⚠️" : "✓"}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Overdue Payments
          </h3>
        </div>
        <p className="text-xs text-gray-600 ml-9 sm:ml-10">
          Late payment status
        </p>
      </div>

      {hasOverdue ? (
        <>
          {/* Overdue Amount - Large and prominent */}
          <div className="mb-4 p-4 sm:p-5 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl sm:rounded-2xl">
            <p className="text-xs text-gray-600 mb-2 sm:mb-3">
              Total Overdue Amount
            </p>
            <p className="text-3xl sm:text-4xl font-bold text-red-600 leading-tight">
              ₱{overdue.total_overdue.toLocaleString()}
            </p>
          </div>

          {/* Overdue Count - Big badge */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                Bills Overdue
              </span>
              <span className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-lg sm:text-xl">
                {overdue.overdue_count}
              </span>
            </div>
          </div>

          {/* Alert Banner - Full width */}
          <div className="mt-auto pt-3 border-t border-gray-200">
            <div className="p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-orange-900 mb-1">
                    Action Required
                  </p>
                  <p className="text-xs text-orange-700 leading-relaxed">
                    Please pay your overdue amount to avoid additional charges
                    and maintain your rental standing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-3">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm sm:text-base font-semibold text-emerald-900">
              All Payments Current
            </p>
            <p className="text-xs text-gray-600 mt-1">
              No overdue payments. Keep it up!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
