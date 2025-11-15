"use client";

import { Calendar } from "lucide-react";

export default function DatesForm({ form, setForm }: any) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">

      {/* ===================== BILLING DATE (EDITABLE) ===================== */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
          Billing Date
        </label>

        <input
          type="date"
          name="billingDate"
          value={form.billingDate || today}
          onChange={(e) =>
            setForm((p: any) => ({ ...p, billingDate: e.target.value }))
          }
          className="
            w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          "
        />

        <p className="text-xs text-gray-500 italic mt-1 flex items-start gap-1">
          <Calendar className="w-3 h-3 mt-0.5" />
          The official billing date for this unit bill.
        </p>
      </div>

      {/* ===================== READING DATE & DUE DATE ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Reading Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
            Reading Date
          </label>

          <input
            type="date"
            name="readingDate"
            value={form.readingDate}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, readingDate: e.target.value }))
            }
            className="
              w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            "
          />

          <p className="text-xs text-gray-500 italic mt-1.5 flex items-start gap-1">
            <Calendar className="w-3 h-3 mt-0.5" />
            Date the meter readings were taken.
          </p>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
            Due Date
          </label>

          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={(e) =>
              setForm((p: any) => ({ ...p, dueDate: e.target.value }))
            }
            className="
              w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            "
          />

          <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1">
            <Calendar className="w-3 h-3 mt-0.5" />
            Based on PropertyConfiguration.billingDueDay.
          </p>
        </div>

      </div>
    </div>
  );
}
