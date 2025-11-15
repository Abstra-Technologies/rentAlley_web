"use client";
import React from "react";
import { Plus, X } from "lucide-react";

export default function DiscountsForm({
  discounts,
  handleAddDiscount,
  handleDiscountChange,
  handleRemoveDiscount,
}: any) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Discounts</h4>
      <p className="text-xs text-gray-500 mb-3">
        Apply discounts such as promos, loyalty rewards, or landlord goodwill.
      </p>

      {discounts.length > 0 ? (
        discounts.map((disc: any, idx: number) => (
          <div
            key={disc.charge_id || idx}
            className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 bg-white border border-gray-200 rounded-lg p-2"
          >
            <input
              type="text"
              placeholder="Type (e.g. Promo)"
              value={disc.type}
              onChange={(e) => handleDiscountChange(idx, "type", e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Amount"
                value={disc.amount}
                onChange={(e) => handleDiscountChange(idx, "amount", e.target.value)}
                className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
              />
              <button
                type="button"
                onClick={() => handleRemoveDiscount(idx, disc)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                aria-label="Remove discount"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-sm italic mb-2">No discounts applied.</p>
      )}

      <button
        type="button"
        onClick={handleAddDiscount}
        className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Discount
      </button>
    </div>
  );
}
