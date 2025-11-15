"use client";
import React from "react";
import { Droplets, Zap } from "lucide-react";

export default function MeterReadingForm({
  form,
  setForm,
  property,
  existingBillingMeta,
}: any) {
  const sanitizeNumericInput = (value: string) => {
    let v = value.replace(/[^0-9.]/g, "");
    if ((v.match(/\./g) || []).length > 1) return value; // ignore extra dot
    const parts = v.split(".");
    if (parts[0].length > 6) parts[0] = parts[0].slice(0, 6);
    if (parts[1]?.length > 2) parts[1] = parts[1].slice(0, 2);
    return parts.join(".");
  };

  const readOnly = !!existingBillingMeta?.billing_id;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border border-gray-300 rounded-lg bg-white text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="p-3 text-left">Utility</th>
            <th className="p-3 text-left">Previous Reading</th>
            <th className="p-3 text-left">Current Reading</th>
          </tr>
        </thead>

        <tbody>
          {/* ================= WATER ROW ================= */}
          {property?.water_billing_type === "submetered" && (
            <tr className="border-t">
              <td className="p-3 font-semibold text-blue-700 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-600" />
                Water
              </td>

              {/* Previous Reading */}
              <td className="p-2">
                <input
                  type="text"
                  name="waterPrevReading"
                  placeholder="Prev"
                  value={form.waterPrevReading}
                  onChange={(e) =>
                    setForm((p: any) => ({
                      ...p,
                      waterPrevReading: sanitizeNumericInput(e.target.value),
                    }))
                  }
                  readOnly={readOnly}
                  inputMode="decimal"
                  maxLength={9}
                  className={`w-full border rounded-lg px-3 py-2.5
                    ${readOnly ? "bg-gray-100 text-gray-500" : "border-gray-300"}
                  `}
                />
              </td>

              {/* Current Reading */}
              <td className="p-2">
                <input
                  type="text"
                  name="waterCurrentReading"
                  placeholder="Current"
                  value={form.waterCurrentReading}
                  onChange={(e) =>
                    setForm((p: any) => ({
                      ...p,
                      waterCurrentReading: sanitizeNumericInput(e.target.value),
                    }))
                  }
                  readOnly={readOnly}
                  inputMode="decimal"
                  maxLength={9}
                  className={`w-full border rounded-lg px-3 py-2.5
                    ${readOnly ? "bg-gray-100 text-gray-500" : "border-gray-300"}
                  `}
                />
              </td>
            </tr>
          )}

          {/* ================= ELECTRICITY ROW ================= */}
          {property?.electricity_billing_type === "submetered" && (
            <tr className="border-t">
              <td className="p-3 font-semibold text-amber-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                Electricity
              </td>

              {/* Previous Reading */}
              <td className="p-2">
                <input
                  type="text"
                  name="electricityPrevReading"
                  placeholder="Prev"
                  value={form.electricityPrevReading}
                  onChange={(e) =>
                    setForm((p: any) => ({
                      ...p,
                      electricityPrevReading: sanitizeNumericInput(e.target.value),
                    }))
                  }
                  readOnly={readOnly}
                  inputMode="decimal"
                  maxLength={9}
                  className={`w-full border rounded-lg px-3 py-2.5
                    ${readOnly ? "bg-gray-100 text-gray-500" : "border-gray-300"}
                  `}
                />
              </td>

              {/* Current Reading */}
              <td className="p-2">
                <input
                  type="text"
                  name="electricityCurrentReading"
                  placeholder="Current"
                  value={form.electricityCurrentReading}
                  onChange={(e) =>
                    setForm((p: any) => ({
                      ...p,
                      electricityCurrentReading: sanitizeNumericInput(e.target.value),
                    }))
                  }
                  readOnly={readOnly}
                  inputMode="decimal"
                  maxLength={9}
                  className={`w-full border rounded-lg px-3 py-2.5
                    ${readOnly ? "bg-gray-100 text-gray-500" : "border-gray-300"}
                  `}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
