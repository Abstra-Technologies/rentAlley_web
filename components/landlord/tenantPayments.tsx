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
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <div className="divide-y divide-gray-100">
                {payments.map((payment) => (
                    <div
                        key={payment.payment_id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-2.5 hover:bg-blue-50/40 transition-all text-sm sm:text-[15px]"
                    >
                        {/* LEFT SECTION - Tenant / Property / Unit */}
                        <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap flex-1 min-w-0">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-md flex items-center justify-center flex-shrink-0">
                                <svg
                                    className="w-3.5 h-3.5 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
                                    />
                                </svg>
                            </div>

                            <div className="min-w-0 leading-snug text-gray-700">
                                <p className="font-medium text-gray-800">
                <span className="font-semibold text-gray-900">
                  {payment.tenant_name || "Unknown Tenant"}
                </span>{" "}
                                    from{" "}
                                    <span className="font-medium text-gray-800">
                  {payment.property_name}
                </span>{" "}
                                    unit{" "}
                                    <span className="text-gray-600">{payment.unit_name}</span>{" "}
                                    paid{" "}
                                    <span className="font-semibold text-emerald-700">
                  {formatCurrency(payment.amount_paid)}
                </span>{" "}
                                    at{" "}
                                    <span className="text-gray-500">
                  {payment.payment_date || "No timestamp"}
                </span>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );


}
