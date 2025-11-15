"use client";
import React from "react";
import { Plus, X } from "lucide-react";

export default function ExtraChargesForm({
  extraExpenses,
  handleAddExpense,
  handleExpenseChange,
  handleRemoveExpense,
}: any) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Charges</h4>
      <p className="text-xs text-gray-500 mb-3">
        Add extra charges such as parking fees, association dues, or maintenance.
      </p>

      {extraExpenses.length > 0 ? (
        extraExpenses.map((exp: any, idx: number) => (
          <div
            key={exp.charge_id || idx}
            className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 bg-white border border-gray-200 rounded-lg p-2"
          >
            <input
              type="text"
              placeholder="Type (e.g. Parking)"
              value={exp.type}
              onChange={(e) => handleExpenseChange(idx, "type", e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Amount"
                inputMode="decimal"
                value={exp.amount}
                onChange={(e) => handleExpenseChange(idx, "amount", e.target.value)}
                className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
              />
              <button
                type="button"
                onClick={() => handleRemoveExpense(idx, exp)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                aria-label="Remove additional charge"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-sm italic mb-2">No additional charges set.</p>
      )}

      <button
        type="button"
        onClick={handleAddExpense}
        className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Expense
      </button>
    </div>
  );
}
