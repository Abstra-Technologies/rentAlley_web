"use client";

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

export default function PaymentDueWidget({
  agreement_id,
}: PaymentDueWidgetProps) {
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agreement_id) return;

    let active = true;

    async function fetchBilling() {
      setLoading(true);
      try {
        const response = await axios.get<{ billing: BillingSummary }>(
          `/api/tenant/dashboard/getPaymentDue?agreement_id=${agreement_id}`
        );

        if (active) setBilling(response.data.billing);
      } catch (err: any) {
        if (active)
          setError(
            err.response?.data?.message || "Failed to fetch billing data."
          );
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchBilling();
    return () => {
      active = false;
    };
  }, [agreement_id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="h-2 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-red-700 text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="text-center py-6">
        <CreditCardIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No billing data</p>
      </div>
    );
  }

  const total_due = billing.total_due;
  const paid_amount = billing.paid_amount;
  const remainingAmount = Math.max(total_due - paid_amount, 0);
  const progressPercent = total_due ? (paid_amount / total_due) * 100 : 0;
  const isPaid = remainingAmount === 0;
  const isOverdue = remainingAmount > 0 && progressPercent < 50;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className={`p-1.5 rounded-lg ${
            isPaid ? "bg-emerald-100" : isOverdue ? "bg-red-100" : "bg-blue-100"
          }`}
        >
          <CreditCardIcon
            className={`w-4 h-4 ${
              isPaid
                ? "text-emerald-600"
                : isOverdue
                ? "text-red-600"
                : "text-blue-600"
            }`}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900">Payment Status</h3>
          <p className="text-xs text-gray-600">Balance overview</p>
        </div>
      </div>

      {/* Amount Card */}
      <div
        className={`rounded-lg border p-4 text-center ${
          isPaid
            ? "bg-emerald-50 border-emerald-200"
            : isOverdue
            ? "bg-red-50 border-red-200"
            : "bg-blue-50 border-blue-200"
        }`}
      >
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          {isPaid ? "Paid in Full" : "Balance Due"}
        </p>
        <p
          className={`text-3xl font-bold mb-1 ${
            isPaid
              ? "text-emerald-600"
              : isOverdue
              ? "text-red-600"
              : "text-blue-600"
          }`}
        >
          ₱{remainingAmount.toLocaleString()}
        </p>
        <p className="text-xs text-gray-600">
          of{" "}
          <span className="font-semibold">₱{total_due.toLocaleString()}</span>{" "}
          total
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">Payment Progress</span>
          <span
            className={`font-bold ${
              isPaid
                ? "text-emerald-600"
                : isOverdue
                ? "text-red-600"
                : "text-blue-600"
            }`}
          >
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              isPaid
                ? "bg-emerald-500"
                : isOverdue
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>₱{paid_amount.toLocaleString()} paid</span>
          <span>₱{remainingAmount.toLocaleString()} left</span>
        </div>
      </div>

      {/* Status Message */}
      {isPaid && (
        <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">All Paid</p>
            <p className="text-xs text-emerald-700">
              Your payments are complete
            </p>
          </div>
        </div>
      )}

      {!isPaid && isOverdue && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Payment Needed</p>
            <p className="text-xs text-red-700">Large balance remaining</p>
          </div>
        </div>
      )}

      {!isPaid && !isOverdue && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <CreditCardIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">On Track</p>
            <p className="text-xs text-blue-700">Keep up with your payments</p>
          </div>
        </div>
      )}
    </div>
  );
}
