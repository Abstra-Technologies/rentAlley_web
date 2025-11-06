import { useEffect, useState } from "react";
import axios from "axios";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

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
          <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
        ))}
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

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center mb-4">
          <BanknotesIcon className="w-10 h-10 text-blue-600" />
        </div>
        <h4 className="text-lg font-bold text-gray-900 mb-2">
          No Payments Yet
        </h4>
        <p className="text-sm text-gray-600 max-w-xs">
          Payment history will appear here once you make a payment.
        </p>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    const statusMap: Record<
      string,
      { bg: string; text: string; border: string; icon: any }
    > = {
      confirmed: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        icon: CheckCircleIcon,
      },
      pending: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        icon: ClockIcon,
      },
      failed: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircleIcon,
      },
      cancelled: {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
        icon: XCircleIcon,
      },
    };
    return (
      statusMap[status.toLowerCase()] || {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
        icon: ClockIcon,
      }
    );
  };

  const recentPayments = payments.slice(0, 5);

  const totalPaid = payments
    .filter((p) => p.payment_status.toLowerCase() === "confirmed")
    .reduce((sum, p) => {
      const amount = Number(p.amount_paid);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

  const formatTotalPaid = () => {
    if (totalPaid === 0) return "₱0";
    if (totalPaid >= 1000) {
      return `₱${(totalPaid / 1000).toLocaleString(undefined, {
        maximumFractionDigits: 1,
      })}k`;
    }
    return `₱${totalPaid.toLocaleString()}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl">
          <BanknotesIcon className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
          <p className="text-xs text-gray-600">Recent transactions</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
            Total Payments
          </p>
          <p className="text-3xl font-bold text-blue-600">{payments.length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
            Total Paid
          </p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatTotalPaid()}
          </p>
        </div>
      </div>

      {/* Recent Payments List */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-80">
        {recentPayments.map((payment) => {
          const statusConfig = getStatusConfig(payment.payment_status);
          const StatusIcon = statusConfig.icon;
          const paymentAmount = Number(payment.amount_paid);

          return (
            <div
              key={payment.payment_id}
              className={`rounded-xl border-2 ${statusConfig.border} ${statusConfig.bg} p-4 hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm mb-1 truncate">
                    {payment.payment_type.replace(/_/g, " ").toUpperCase()}
                  </h4>
                  <p className="text-xs text-gray-600">
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
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-lg">
                    ₱
                    {isNaN(paymentAmount)
                      ? "0"
                      : paymentAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConfig.bg} border ${statusConfig.border}`}
                >
                  <StatusIcon className={`w-4 h-4 ${statusConfig.text}`} />
                  <span className={`text-xs font-bold ${statusConfig.text}`}>
                    {payment.payment_status.charAt(0).toUpperCase() +
                      payment.payment_status.slice(1)}
                  </span>
                </div>
                <span className="text-xs text-gray-600 font-medium truncate">
                  via {payment.method_name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* View More Indicator */}
      {payments.length > 5 && (
        <div className="mt-4 pt-4 border-t-2 border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            <span className="font-bold text-blue-600">
              +{payments.length - 5}
            </span>{" "}
            more {payments.length - 5 === 1 ? "payment" : "payments"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Click anywhere to view full history
          </p>
        </div>
      )}
    </div>
  );
}
