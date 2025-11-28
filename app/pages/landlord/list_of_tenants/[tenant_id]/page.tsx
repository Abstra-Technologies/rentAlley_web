"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import { User, Briefcase, Calendar, MapPin, CreditCard } from "lucide-react";

import LoadingScreen from "@/components/loadingScreen";

export default function TenantDetails() {
  const params = useParams();
  const tenant_id = params?.tenant_id;
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant_id) return;

    fetch(`/api/landlord/properties/getCurrentTenants/viewDetail/${tenant_id}`)
      .then((res) => res.json())
      .then((data) => {
        setTenant(data.tenant);
        setPaymentHistory(data.paymentHistory);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching tenant details:", error);
        setLoading(false);
      });
  }, [tenant_id]);

  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "payment_date",
        header: "Date",
        Cell: ({ cell }) =>
          new Date(cell.getValue<string>()).toLocaleDateString(),
      },
      {
        accessorKey: "payment_type",
        header: "Type",
      },
      {
        accessorKey: "amount_paid",
        header: "Amount",
        Cell: ({ cell }) =>
          `₱${Number(cell.getValue<number>() || 0).toFixed(2)}`,
        muiTableBodyCellProps: {
          align: "right",
        },
      },
      {
        accessorKey: "payment_status",
        header: "Status",
        Cell: ({ cell }) => {
          const status = cell.getValue<string>();
          return (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                status === "confirmed"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {status}
            </span>
          );
        },
        muiTableBodyCellProps: {
          align: "center",
        },
      },
    ],
    []
  );

  if (loading)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
        <LoadingScreen message="Just a moment, preparing your tenant data..." />
      </div>
    );

  if (!tenant)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-lg">Tenant not found.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      <div className="px-4 pt-20 pb-24 md:px-8 lg:px-12 xl:px-16">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 p-5 md:p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {tenant?.firstName} {tenant?.lastName}
                  </h1>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                    Tenant
                  </span>
                </div>
                <p className="text-blue-100 text-sm md:text-base break-all">
                  {tenant?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center shadow-md">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Personal Information
                  </h2>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-600 sm:w-32">
                      Occupation:
                    </span>
                    <span className="font-medium text-gray-900">
                      {tenant?.occupation}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-600 sm:w-32">
                      Employment:
                    </span>
                    <span className="font-medium text-gray-900">
                      {tenant?.employment_type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lease Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg flex items-center justify-center shadow-md">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Lease Information
                  </h2>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-600 sm:w-32 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Property:
                    </span>
                    <span className="font-medium text-gray-900">
                      {tenant?.property_name}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-600 sm:w-32">
                      Start Date:
                    </span>
                    <span className="font-medium text-gray-900">
                      {new Date(tenant?.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm font-semibold text-gray-600 sm:w-32">
                      End Date:
                    </span>
                    <span className="font-medium text-gray-900">
                      {new Date(tenant?.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-5 md:p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg flex items-center justify-center shadow-md">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Payment History
              </h3>
            </div>

            {paymentHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  No payment records found.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <MaterialReactTable
                  columns={columns}
                  data={paymentHistory}
                  enableSorting
                  enableColumnActions={false}
                  enableDensityToggle={false}
                  initialState={{
                    pagination: { pageSize: 5, pageIndex: 0 },
                  }}
                  muiTableContainerProps={{ sx: { width: "100%" } }}
                  muiTablePaperProps={{
                    sx: {
                      width: "100%",
                      boxShadow: "none",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                    },
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
