"use client";
import React from "react";

export default function ActionsBar({ onSubmit, hasExistingBilling }: any) {
  return (
    <div className="mt-4 lg:mt-6 flex items-center justify-end gap-3">
      <button
        onClick={onSubmit}
        className={`px-5 py-2.5 rounded-lg font-semibold text-white shadow-sm transition-colors ${
          hasExistingBilling ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"
        }`}
      >
        {hasExistingBilling ? "Update Billing" : "Submit Billing"}
      </button>
    </div>
  );
}
