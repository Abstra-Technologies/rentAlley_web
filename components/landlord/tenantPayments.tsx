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

  if (loading)
    return (
        <div className="flex justify-center items-center h-64">
          <div className="text-white/80 text-lg animate-pulse">
            Loading payments...
          </div>
        </div>
    );

  if (error)
    return (
        <p className="text-red-400 text-center py-10 font-medium">Error: {error}</p>
    );

  if (payments.length === 0)
    return (
        <div className="flex items-center justify-center h-72">
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-5xl mb-3">💸</div>
            <p className="text-white font-semibold">No Payments Found</p>
            <p className="text-gray-300 text-sm mt-1">
              Tenant payments will appear here once available.
            </p>
          </div>
        </div>
    );

  return (
      <div className="flex flex-col gap-3 h-[480px] sm:h-[560px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent p-1">
        {payments.map((payment) => (
            <div
                key={payment.payment_id}
                className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="space-y-1">
                  <p className="text-white font-semibold text-sm sm:text-base">
                    {payment.property_name}
                  </p>
                  <p className="text-gray-300 text-sm">
                    Unit:{" "}
                    <span className="text-white font-medium">
                  {payment.unit_name}
                </span>
                  </p>
                  <p className="text-gray-300 text-sm">
                    Type:{" "}
                    <span className="text-white font-medium">
                  {payment.payment_type}
                </span>
                  </p>
                </div>

                <div className="mt-3 sm:mt-0 text-right">
                  <p className="text-lg font-bold text-emerald-300">
                    {formatCurrency(payment.amount_paid)}
                  </p>
                  <p
                      className={`text-xs mt-1 uppercase font-semibold ${
                          payment.payment_status === "confirmed"
                              ? "text-green-400"
                              : "text-red-400"
                      }`}
                  >
                    {payment.payment_status}
                  </p>
                </div>
              </div>

              {/* Optional details below */}
              <div className="mt-3 border-t border-white/10 pt-2 flex justify-between text-xs text-gray-400">
            <span>
              {payment.payment_date
                  ? formatDate(payment.payment_date)
                  : "No date"}
            </span>
                <span>Ref: {payment.receipt_reference || "N/A"}</span>
              </div>
            </div>
        ))}
      </div>
  );
}
