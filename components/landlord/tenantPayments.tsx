"use client";
import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";
import { Receipt, User, Building2 } from "lucide-react";

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
      <div className="space-y-2 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-3 border border-gray-200 rounded-lg bg-gray-50"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Receipt className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm font-medium text-red-600 mb-1">
          Error Loading Payments
        </p>
        <p className="text-xs text-gray-600">{error}</p>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Receipt className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-sm font-semibold text-gray-900 mb-1">
          No Payments Yet
        </p>
        <p className="text-xs text-gray-600">
          Tenant payments will appear here once available.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {payments.slice(0, 5).map((payment) => (
        <div
          key={payment.payment_id}
          className="p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <Receipt className="w-4 h-4 text-emerald-700" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {payment.tenant_name || "Unknown Tenant"}
                </p>
                <span className="text-sm font-bold text-emerald-700 flex-shrink-0">
                  {formatCurrency(payment.amount_paid)}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-600 mb-0.5">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {payment.property_name} • {payment.unit_name}
                </span>
              </div>

              <p className="text-xs text-gray-500">
                {payment.payment_date || "No timestamp"}
              </p>
            </div>
          </div>
        </div>
      ))}

      {payments.length > 5 && (
        <p className="text-center text-xs text-gray-500 pt-2">
          +{payments.length - 5} more payments
        </p>
      )}
    </div>
  );
}
