"use client";

import useSWR from "swr";
import { formatCurrency } from "@/utils/formatter/formatters";
import { Receipt, Building2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  CARD_CONTAINER_INTERACTIVE,
  CARD_CONTAINER,
  ITEM_BASE,
  ITEM_HOVER,
  GRADIENT_ICON_BG,
  EMPTY_STATE_CONTAINER,
  EMPTY_STATE_CONTENT,
  EMPTY_STATE_ICON,
  EMPTY_STATE_TITLE,
  EMPTY_STATE_DESC,
  CUSTOM_SCROLLBAR,
  SECTION_HEADER,
  GRADIENT_DOT,
  SECTION_TITLE,
} from "@/constant/design-constants";

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
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  /* =========================
          LOADING STATE
    ========================== */
  if (isLoading) {
    return (
      <div className={CARD_CONTAINER}>
        <div className={`${SECTION_HEADER} mb-4`}>
          <span className={GRADIENT_DOT} />
          <h2 className={SECTION_TITLE}>Recent Payments</h2>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`${ITEM_BASE} p-2.5`}>
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
      </div>
    );
  }

  /* =========================
          ERROR STATE
    ========================== */
  if (error) {
    return (
      <div className={CARD_CONTAINER}>
        <div className={`${SECTION_HEADER} mb-4`}>
          <span className={GRADIENT_DOT} />
          <h2 className={SECTION_TITLE}>Recent Payments</h2>
        </div>
        <div className={EMPTY_STATE_CONTAINER}>
          <div className={EMPTY_STATE_CONTENT}>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Receipt className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm font-medium text-red-600 mb-1">
              Error Loading Payments
            </p>
            <p className={EMPTY_STATE_DESC}>{(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
          EMPTY STATE
    ========================== */
  if (!payments.length) {
    return (
      <div className={CARD_CONTAINER}>
        <div className={`${SECTION_HEADER} mb-4`}>
          <span className={GRADIENT_DOT} />
          <h2 className={SECTION_TITLE}>Recent Payments</h2>
        </div>
        <div className={EMPTY_STATE_CONTAINER}>
          <div className={EMPTY_STATE_CONTENT}>
            <div className={EMPTY_STATE_ICON}>
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <p className={EMPTY_STATE_TITLE}>No Payments Yet</p>
            <p className={EMPTY_STATE_DESC}>
              Tenant payments will appear here once available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
          NORMAL STATE
    ========================== */
  return (
    <div
      onClick={() =>
        router.push("/pages/landlord/analytics/detailed/paymentLogs")
      }
      className={`${CARD_CONTAINER_INTERACTIVE} flex flex-col h-full`}
    >
      {/* Header */}
      <div className={`${SECTION_HEADER} mb-4`}>
        <span className={GRADIENT_DOT} />
        <h2 className={SECTION_TITLE}>Recent Payments</h2>
      </div>

      {/* Payment List */}
      <div
        className={`space-y-2 overflow-y-auto max-h-[400px] pr-2 ${CUSTOM_SCROLLBAR} flex-1`}
      >
        {payments.slice(0, 6).map((payment: any) => (
          <div key={payment.payment_id} className={`${ITEM_BASE} p-2.5`}>
            <div className="flex items-start gap-2.5">
              <div
                className={`w-7 h-7 ${GRADIENT_ICON_BG} rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner`}
              >
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

      {/* View All Button */}
      {payments.length > 6 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/pages/landlord/analytics/detailed/paymentLogs");
            }}
            className="w-full flex items-center justify-center gap-2 py-2
                        text-sm font-medium text-blue-600 rounded-lg
                        transition-all duration-300
                        hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-emerald-600
                        group"
          >
            <span>View All {payments.length} Payments</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}
    </div>
  );
}
