"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { MRT_ColumnDef, MaterialReactTable } from "material-react-table";
import { formatCurrency } from "@/utils/formatter/formatters";
import { Droplets, Zap, Calendar, AlertCircle } from "lucide-react";

export default function ConcessionaireBillingHistory({
  propertyId,
}: {
  propertyId: number;
}) {
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;
    fetchBillingData();
  }, [propertyId]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/landlord/properties/getConcessionaireHistory?property_id=${propertyId}`
      );
      setBillings(res.data.billings || []);
    } catch (err) {
      console.error("❌ Failed to load concessionaire billing:", err);
      Swal.fire(
        "Error",
        "Failed to fetch concessionaire billing history.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // 🧾 Define table columns
  const columns: MRT_ColumnDef<any>[] = [
    {
      accessorKey: "billing_period",
      header: "Billing Period",
      Cell: ({ cell }) =>
        new Date(cell.getValue() as string).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
        }),
    },
    {
      accessorKey: "water_consumption",
      header: "Water (m³)",
      Cell: ({ cell }) => Number(cell.getValue() || 0).toFixed(2),
    },
    {
      id: "water_rate",
      header: "Water Rate",
      Cell: ({ row }) => {
        const wCons = Number(row.original.water_consumption || 0);
        const wTotal = Number(row.original.water_total || 0);
        const rate = wCons > 0 ? wTotal / wCons : 0;
        return rate ? `₱${rate.toFixed(2)}/m³` : "-";
      },
    },
    {
      accessorKey: "water_total",
      header: "Water Total",
      Cell: ({ cell }) => formatCurrency(cell.getValue()),
    },
    {
      accessorKey: "electricity_consumption",
      header: "Electricity (kWh)",
      Cell: ({ cell }) => Number(cell.getValue() || 0).toFixed(2),
    },
    {
      id: "electricity_rate",
      header: "Electricity Rate",
      Cell: ({ row }) => {
        const eCons = Number(row.original.electricity_consumption || 0);
        const eTotal = Number(row.original.electricity_total || 0);
        const rate = eCons > 0 ? eTotal / eCons : 0;
        return rate ? `₱${rate.toFixed(2)}/kWh` : "-";
      },
    },
    {
      accessorKey: "electricity_total",
      header: "Electricity Total",
      Cell: ({ cell }) => formatCurrency(cell.getValue()),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      Cell: ({ cell }) =>
        new Date(cell.getValue() as string).toLocaleDateString("en-PH"),
    },
  ];

  // ⏳ Loading state
  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse space-y-4 w-full">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-16 w-full"></div>
          ))}
        </div>
      </div>
    );

  // 🧍 No data
  if (!billings.length)
    return (
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-gray-900 font-semibold text-lg mb-1">
          No Billing Records
        </p>
        <p className="text-gray-500 text-sm">
          No concessionaire billing records found for this property.
        </p>
      </div>
    );

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium mb-1">
              About This Data
            </p>
            <p className="text-xs text-blue-700">
              These records reflect utility costs inputted from your utility
              providers. They serve as the basis for computing the submetered
              water and electricity charges applied to each tenant unit.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Water Stats */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">
                Total Water Consumption
              </p>
              <p className="text-lg font-bold text-gray-900">
                {billings
                  .reduce(
                    (sum, b) => sum + Number(b.water_consumption || 0),
                    0
                  )
                  .toFixed(2)}{" "}
                m³
              </p>
            </div>
          </div>
        </div>

        {/* Electricity Stats */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">
                Total Electricity Consumption
              </p>
              <p className="text-lg font-bold text-gray-900">
                {billings
                  .reduce(
                    (sum, b) => sum + Number(b.electricity_consumption || 0),
                    0
                  )
                  .toFixed(2)}{" "}
                kWh
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <MaterialReactTable
          columns={columns}
          data={billings}
          enablePagination
          enableColumnActions={false}
          enableColumnFilters={false}
          enableSorting={true}
          enableTopToolbar={false}
          initialState={{
            density: "comfortable",
            pagination: { pageIndex: 0, pageSize: 10 },
          }}
          muiTableContainerProps={{
            sx: { maxHeight: "600px" },
            className: "overflow-x-auto",
          }}
          muiTableHeadCellProps={{
            sx: {
              fontWeight: 700,
              fontSize: "0.875rem",
              backgroundColor: "#f9fafb",
              color: "#374151",
              borderBottom: "2px solid #e5e7eb",
            },
          }}
          muiTableBodyCellProps={{
            sx: {
              fontSize: "0.875rem",
              color: "#1f2937",
            },
          }}
          muiTableBodyProps={{
            sx: {
              "& tr:hover": {
                backgroundColor: "#f3f4f6",
              },
            },
          }}
          muiTablePaginationProps={{
            rowsPerPageOptions: [5, 10, 20],
          }}
        />
      </div>
    </div>
  );
}