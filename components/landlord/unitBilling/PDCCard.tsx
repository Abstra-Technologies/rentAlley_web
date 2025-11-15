"use client";
import React from "react";
import { CreditCard, Check } from "lucide-react";

export default function PDCCard({ pdc, loadingPdc, handleMarkCleared }: any) {
  const fmtPHP = (n: number | string) =>
    Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loadingPdc) {
    return (
      <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50 text-indigo-700 text-sm">
        Loading PDC details…
      </div>
    );
  }

  if (!pdc) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-gray-600 text-sm">
        No PDC linked to this billing (or lease).
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Post-Dated Check
        </h4>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
          pdc.status === "cleared"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : pdc.status === "bounced"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {String(pdc.status || "").toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 mb-3">
        <p><strong>Bank:</strong> {pdc.bank_name || "—"}</p>
        <p><strong>Check #:</strong> {pdc.check_number || "—"}</p>
        <p><strong>Amount:</strong> ₱{fmtPHP(pdc.amount || 0)}</p>
        <p><strong>Due Date:</strong> {pdc.due_date ? new Date(pdc.due_date).toLocaleDateString() : "—"}</p>
      </div>

      {pdc.status !== "cleared" && pdc.status !== "bounced" && (
        <button
          onClick={handleMarkCleared}
          className="w-full mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold"
        >
          <Check className="w-4 h-4 inline mr-2" /> Mark as Cleared
        </button>
      )}

      {pdc.status === "cleared" && (
        <p className="mt-2 text-xs text-emerald-700 flex items-start gap-1">
          <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
          This cleared PDC is applied to the total due below.
        </p>
      )}
    </div>
  );
}
