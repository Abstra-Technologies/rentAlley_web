"use client";

import useSWR from "swr";
import { formatCurrency } from "@/utils/formatter/formatters";
import { Receipt, Building2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch payments");
  return data;
};

export default function PaymentList({ landlord_id }: { landlord_id?: string }) {
  const router = useRouter();
  const {
    data: payments = [],
    isLoading,
    error,
  } = useSWR(
    landlord_id
      ? `/api/landlord/payments/getPaymentList?landlord_id=${landlord_id}`
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="p-2.5 border border-gray-200 rounded-lg bg-gray-50"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm font-medium text-red-600 mb-1">
            Error Loading Payments
          </p>
          <p className="text-xs text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {payments.slice(0, 6).map((payment: any) => (
          <div
            key={payment.payment_id}
            className="p-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <Receipt className="w-3.5 h-3.5 text-emerald-700" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {payment.tenant_name || "Unknown Tenant"}
                  </p>
                  <span className="text-xs font-bold text-emerald-700 flex-shrink-0">
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
      </div>

      {payments.length > 6 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={() =>
              router.push("/pages/landlord/analytics/detailed/paymentLogs")
            }
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-emerald-600 rounded-lg transition-all group"
          >
            <span>View All {payments.length} Payments</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
