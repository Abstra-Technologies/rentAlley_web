"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { MRT_ColumnDef, MaterialReactTable } from "material-react-table";
import { Gauge, Droplet, Zap, Loader2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatter/formatters";

export default function MeterReadings({ unitId }: { unitId: number }) {
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitId) return;
    fetchReadings();
  }, [unitId]);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/properties/units/meterReadings?unit_id=${unitId}`
      );
      setReadings(res.data.readings || []);
    } catch (err) {
      console.error("❌ Failed to load readings:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch meter readings.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  // Define table columns
  const columns: MRT_ColumnDef<any>[] = [
    {
      accessorKey: "utility_type",
      header: "Utility",
      size: 100,
      Cell: ({ cell }) => {
        const type = cell.getValue() as string;
        return (
          <div className="flex items-center gap-1.5 font-medium text-gray-900">
            {type === "water" ? (
              <>
                <Droplet className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Water</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Electric</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "reading_date",
      header: "Date",
      size: 90,
      Cell: ({ cell }) => {
        const date = new Date(cell.getValue() as string);
        return (
          <span className="text-xs sm:text-sm">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "2-digit",
            })}
          </span>
        );
      },
    },
    {
      accessorKey: "previous_reading",
      header: "Previous",
      size: 80,
      Cell: ({ cell }) => (
        <span className="font-mono text-xs sm:text-sm">
          {Number(cell.getValue() || 0)}
        </span>
      ),
    },
    {
      accessorKey: "current_reading",
      header: "Current",
      size: 80,
      Cell: ({ cell }) => (
        <span className="font-mono font-semibold text-xs sm:text-sm">
          {Number(cell.getValue() || 0)}
        </span>
      ),
    },
    {
      id: "usage",
      header: "Usage",
      size: 70,
      Cell: ({ row }) => {
        const prev = Number(row.original.previous_reading || 0);
        const curr = Number(row.original.current_reading || 0);
        const usage = Math.max(curr - prev, 0);
        return (
          <span className="font-mono text-blue-600 font-semibold text-xs sm:text-sm">
            {usage.toFixed(1)}
          </span>
        );
      },
    },
    {
      id: "total",
      header: "Amount",
      size: 90,
      Cell: ({ row }) => {
        const r = row.original;
        const prev = Number(r.previous_reading || 0);
        const curr = Number(r.current_reading || 0);
        const usage = Math.max(curr - prev, 0);
        const rate =
          r.utility_type === "water"
            ? Number(r.water_rate || 0)
            : Number(r.electricity_rate || 0);
        const total = usage * rate;
        return rate > 0 ? (
          <span className="text-emerald-700 font-semibold text-xs sm:text-sm whitespace-nowrap">
            {formatCurrency(total)}
          </span>
        ) : (
          <span className="text-gray-400 text-xs sm:text-sm">-</span>
        );
      },
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading meter readings...</p>
        </div>
      </div>
    );
  }

  // No data fallback
  if (!readings.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Gauge className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-900 font-semibold mb-1">
          No Meter Readings Found
        </p>
        <p className="text-gray-500 text-sm">
          No readings have been recorded for this unit yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Gauge className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">Meter Readings</h2>
        <span className="ml-auto text-sm text-gray-500">
          {readings.length} {readings.length === 1 ? "reading" : "readings"}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <MaterialReactTable
            columns={columns}
            data={readings}
            enablePagination
            enableColumnActions={false}
            enableColumnFilters={false}
            enableSorting={true}
            enableTopToolbar={false}
            enableColumnResizing={false}
            enableDensityToggle={false}
            layoutMode="semantic"
            initialState={{
              density: "compact",
              pagination: { pageIndex: 0, pageSize: 10 },
            }}
            muiTableBodyProps={{
              sx: {
                "& tr:nth-of-type(odd)": { backgroundColor: "#f9fafb" },
                "& tr:hover": { backgroundColor: "#f3f4f6" },
              },
            }}
            muiTableContainerProps={{
              sx: {
                maxHeight: "600px",
                width: "100%",
              },
            }}
            muiTableHeadCellProps={{
              sx: {
                fontWeight: 600,
                fontSize: "0.75rem",
                backgroundColor: "#f8fafc",
                color: "#374151",
                padding: "10px 8px",
                "@media (min-width: 640px)": {
                  fontSize: "0.875rem",
                  padding: "12px 16px",
                },
              },
            }}
            muiTableBodyCellProps={{
              sx: {
                fontSize: "0.75rem",
                color: "#1f2937",
                padding: "8px 8px",
                "@media (min-width: 640px)": {
                  fontSize: "0.875rem",
                  padding: "12px 16px",
                },
              },
            }}
            muiTablePaperProps={{
              elevation: 0,
              sx: {
                boxShadow: "none",
                width: "100%",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
