import { useEffect, useState } from "react";
import axios from "axios";
import {
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface BillingSummary {
  total_due: number;
  paid_amount: number;
}

interface PaymentDueWidgetProps {
  agreement_id: number;
}

export default function PaymentDueWidget({ agreement_id }: PaymentDueWidgetProps) {
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
        setError(err.response?.data?.message || "Failed to fetch billing data.");
      } finally {
        setLoading(false);
      }
    }

    if (agreement_id) fetchBilling();
  }, [agreement_id]);

  /* ======================= LOADING ======================= */
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  /* ======================= ERROR ======================= */
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-red-700 text-xs font-semibold">{error}</p>
      </div>
    );
  }

  if (!billing)
    return (
      <div className="text-center py-4">
        <p className="text-gray-500 text-xs">No billing information available.</p>
      </div>
    );

  /* ======================= BILLING LOGIC ======================= */
  const { total_due, paid_amount } = billing;
  const remainingAmount = Math.max(total_due - paid_amount, 0);
  const progressPercent = total_due ? (paid_amount / total_due) * 100 : 0;

  const isPaid = remainingAmount === 0;
  const isOverdue = remainingAmount > total_due * 0.5;

  /* ======================= UI ======================= */
  return (
    <div className="flex flex-col h-full">

      {/* HEADER */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-amber-100 rounded-lg">
          <CreditCardIcon className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Payment Due</h3>
          <p className="text-[11px] text-gray-600">Outstanding balance</p>
        </div>
      </div>

      {/* AMOUNT BOX */}
      <div
        className={`rounded-xl p-3 mb-4 border text-center
          ${
            isPaid
              ? "bg-emerald-50 border-emerald-300"
              : isOverdue
              ? "bg-red-50 border-red-300"
              : "bg-blue-50 border-blue-300"
          }
        `}
      >
        <p className="text-[11px] font-semibold text-gray-600 mb-1">Amount Remaining</p>

        <p
          className={`font-extrabold leading-tight 
            text-2xl sm:text-3xl
            ${
              isPaid
                ? "text-emerald-600"
                : isOverdue
                ? "text-red-600"
                : "bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent"
            }
          `}
        >
          ₱{remainingAmount.toLocaleString()}
        </p>

        <p className="text-[11px] sm:text-xs text-gray-600 mt-1">
          of <span className="font-semibold">₱{total_due.toLocaleString()}</span> total
        </p>
      </div>

      {/* PROGRESS */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-[11px] sm:text-xs">
          <span className="font-semibold text-gray-700">Progress</span>
          <span
            className={`font-bold ${
              isPaid ? "text-emerald-600" : isOverdue ? "text-red-600" : "text-blue-600"
            }`}
          >
            {Math.round(progressPercent)}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700
              ${
                isPaid
                  ? "bg-emerald-500"
                  : isOverdue
                  ? "bg-red-500"
                  : "bg-blue-500"
              }
            `}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] sm:text-xs text-gray-600">
          <span>₱{paid_amount.toLocaleString()} paid</span>
          <span>₱{remainingAmount.toLocaleString()} due</span>
        </div>
      </div>

      {/* STATUS BADGE */}
      {isPaid && (
        <div className="mt-auto p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
          <div>
            <p className="font-bold text-emerald-900 text-xs">Fully Paid</p>
            <p className="text-[10px] text-emerald-700">All payments complete</p>
          </div>
        </div>
      )}

      {isOverdue && (
        <div className="mt-auto p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4 text-amber-600" />
          <div>
            <p className="font-bold text-amber-900 text-xs">Action Needed</p>
            <p className="text-[10px] text-amber-700">Large balance remaining</p>
          </div>
        </div>
      )}
    </div>
  );
}
