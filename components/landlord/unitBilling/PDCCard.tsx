"use client";

import React from "react";
import { CreditCard, Check, AlertCircle, Clock, XCircle } from "lucide-react";

interface PDCCardProps {
  pdc: any;
  loadingPdc: boolean;
  handleMarkCleared: () => void;
}

export default function PDCCard({
  pdc,
  loadingPdc,
  handleMarkCleared,
}: PDCCardProps) {
  const fmtPHP = (n: number | string) =>
    Number(n || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Skeleton Loading
  if (loadingPdc) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-200 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-blue-200 rounded animate-pulse" />
          </div>
          <div className="h-5 w-20 bg-blue-200 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 bg-blue-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-blue-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // No PDC
  if (!pdc) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-600">No PDC Linked</p>
            <p className="text-sm text-gray-400">
              No post-dated check for this billing period
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Status styling
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "cleared":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-700",
          icon: <Check className="w-3.5 h-3.5" />,
          gradient: "from-emerald-50 to-teal-50",
        };
      case "bounced":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
          icon: <XCircle className="w-3.5 h-3.5" />,
          gradient: "from-red-50 to-orange-50",
        };
      default:
        return {
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-700",
          icon: <Clock className="w-3.5 h-3.5" />,
          gradient: "from-blue-50 to-indigo-50",
        };
    }
  };

  const statusConfig = getStatusConfig(pdc.status);

  return (
    <div
      className={`bg-gradient-to-br ${statusConfig.gradient} border ${statusConfig.border} rounded-xl p-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm">
              Post-Dated Check
            </h4>
            <p className="text-xs text-gray-500">PDC Payment Method</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
        >
          {statusConfig.icon}
          {String(pdc.status || "pending").toUpperCase()}
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/60 rounded-lg p-2.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
            Bank
          </p>
          <p className="text-sm font-semibold text-gray-800 truncate">
            {pdc.bank_name || "—"}
          </p>
        </div>
        <div className="bg-white/60 rounded-lg p-2.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
            Check #
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {pdc.check_number || "—"}
          </p>
        </div>
        <div className="bg-white/60 rounded-lg p-2.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
            Amount
          </p>
          <p className="text-sm font-bold text-blue-600">
            ₱{fmtPHP(pdc.amount || 0)}
          </p>
        </div>
        <div className="bg-white/60 rounded-lg p-2.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
            Due Date
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {pdc.due_date
              ? new Date(pdc.due_date).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>

      {/* Action Button */}
      {pdc.status !== "cleared" && pdc.status !== "bounced" && (
        <button
          onClick={handleMarkCleared}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg text-sm font-semibold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Mark as Cleared
        </button>
      )}

      {/* Cleared Notice */}
      {pdc.status === "cleared" && (
        <div className="flex items-start gap-2 p-2.5 bg-emerald-100/50 rounded-lg">
          <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-emerald-700">
            This cleared PDC has been applied to the total amount due.
          </p>
        </div>
      )}

      {/* Bounced Notice */}
      {pdc.status === "bounced" && (
        <div className="flex items-start gap-2 p-2.5 bg-red-100/50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">
            This check has bounced. Please contact the tenant for alternative
            payment.
          </p>
        </div>
      )}
    </div>
  );
}
