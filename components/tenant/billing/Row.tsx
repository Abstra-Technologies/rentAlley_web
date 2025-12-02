"use client";

export function Row({ label, value, strong }) {
    return (
        <div className="flex justify-between items-center p-3">
      <span className={`text-sm ${strong ? "font-bold" : "text-gray-700"}`}>
        {label}
      </span>

            <span className={`text-sm font-semibold`}>{value}</span>
        </div>
    );
}
