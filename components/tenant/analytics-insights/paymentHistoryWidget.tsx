import { useEffect, useState } from "react";
import axios from "axios";

interface Payment {
  payment_id: number;
  payment_type: string;
  amount_paid: number;
  payment_status: string;
  payment_date: string;
  receipt_reference: string | null;
  method_name: string;
}

interface PaymentHistoryWidgetProps {
  agreement_id: number;
}

export default function PaymentHistoryWidget({
  agreement_id,
}: PaymentHistoryWidgetProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const response = await axios.get(
          `/api/tenant/payment/currentPaymentHistory?agreement_id=${agreement_id}`
        );
        setPayments(response.data.payments || []);
      } catch (err: any) {
        console.error("Error fetching payments:", err);
        setError("Failed to fetch payment history.");
      } finally {
        setLoading(false);
      }
    }

    if (agreement_id) fetchPayments();
  }, [agreement_id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-200 rounded-lg"></div>
        ))}
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

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-2xl sm:text-3xl">📭</span>
        </div>
        <div>
          <p className="text-sm sm:text-base font-semibold text-gray-900">
            No Payments Yet
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Payment history will appear here once you make a payment.
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { bg: string; text: string; icon: string }
    > = {
      confirmed: { bg: "bg-emerald-100", text: "text-emerald-700", icon: "✓" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: "⏳" },
      failed: { bg: "bg-red-100", text: "text-red-700", icon: "✕" },
      cancelled: { bg: "bg-gray-100", text: "text-gray-700", icon: "◯" },
    };
    return (
      statusMap[status.toLowerCase()] || {
        bg: "bg-gray-100",
        text: "text-gray-700",
        icon: "?",
      }
    );
  };

  const recentPayments = payments.slice(0, 5);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header - Mobile optimized */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-lg">💰</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Payment History
          </h3>
        </div>
        <p className="text-xs text-gray-600 ml-9 sm:ml-10">
          Recent transactions
        </p>
      </div>

      {/* Summary Stats - Two column on mobile */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl">
          <p className="text-xs text-gray-600 mb-2 sm:mb-3">Total Payments</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">
            {payments.length}
          </p>
        </div>
        <div className="p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-xl">
          <p className="text-xs text-gray-600 mb-2 sm:mb-3">Total Paid</p>
          <p className="text-lg sm:text-2xl font-bold text-emerald-600">
            ₱
            {(totalPaid / 1000).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
            k
          </p>
        </div>
      </div>

      {/* Payments List - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
        {recentPayments.map((payment) => {
          const statusBadge = getStatusBadge(payment.payment_status);
          return (
            <div
              key={payment.payment_id}
              className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-lg sm:rounded-xl hover:border-emerald-200 transition-all active:scale-95 sm:active:scale-100"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                    {payment.payment_type.replace(/_/g, " ").toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(payment.payment_date).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
                <p className="font-bold text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-right whitespace-nowrap">
                  ₱{payment.amount_paid.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full ${statusBadge.bg} ${statusBadge.text} flex-shrink-0`}
                >
                  <span>{statusBadge.icon}</span>
                  <span>
                    {payment.payment_status.charAt(0).toUpperCase() +
                      payment.payment_status.slice(1)}
                  </span>
                </span>
                <span className="text-xs text-gray-500 truncate">
                  {payment.method_name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      {payments.length > 5 && (
        <div className="mt-3 pt-3 border-t border-blue-100">
          <p className="text-xs text-center text-gray-600">
            <span className="font-semibold text-blue-600">
              {payments.length - 5}
            </span>
            <span> more payment{payments.length - 5 > 1 ? "s" : ""}</span>
          </p>
        </div>
      )}
    </div>
  );
}
