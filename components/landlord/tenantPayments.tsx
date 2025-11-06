"use client";
import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

export default function PaymentList({ landlord_id }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!landlord_id) return;

    const fetchPayments = async () => {
      try {
        const response = await fetch(
          `/api/landlord/payments/getPaymentList?landlord_id=${landlord_id}`
        );
        const data = await response.json();
        if (response.ok) setPayments(data);
        else throw new Error(data.error || "Failed to fetch payments");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [landlord_id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-1">
            Error Loading Payments
          </p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            No Payments Yet
          </h3>
          <p className="text-sm text-gray-600">
            Tenant payments will appear here once available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto">
      {payments.map((payment) => (
        <div
          key={payment.payment_id}
          className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            {/* Left Section - Property Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                    {payment.property_name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      {payment.unit_name}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium">
                      {payment.payment_type}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Amount & Status */}
            <div className="flex items-center sm:items-end gap-4 sm:flex-col sm:text-right">
              <div className="flex-1 sm:flex-none">
                <p className="text-lg sm:text-xl font-bold text-gray-900">
                  {formatCurrency(payment.amount_paid)}
                </p>
                <div className="mt-1">
                  {payment.payment_status === "confirmed" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold border border-emerald-200">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-md text-xs font-semibold border border-red-200">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      {payment.payment_status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Date & Reference */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {payment.payment_date
                ? formatDate(payment.payment_date)
                : "No date"}
            </span>
            <span className="inline-flex items-center gap-1 text-gray-500">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Ref: {payment.receipt_reference || "N/A"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
