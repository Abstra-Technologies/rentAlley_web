"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";

import LandlordLayout from "../../../../../components/navigation/sidebar-landlord";
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

  if (loading) return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
         <LoadingScreen message='Just a moment, preparing your tenant data...' />;
      </div>
  );
  if (!tenant) return <p>Tenant not found.</p>;

  return (
    <LandlordLayout>
      <div className="container mx-auto p-6 max-w-3xl">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">

          <div className="bg-gradient-to-br from-blue-950/90 via-teal-900/80 to-emerald-900/80 p-4 text-white">
            <h1 className="text-2xl font-bold flex items-center">
                  <span>
                    {tenant?.firstName} {tenant?.lastName}
                  </span>
                            <span className="ml-2 text-sm bg-white/20 py-1 px-2 rounded-full">
                    Tenant
                  </span>
            </h1>
            <p className="text-blue-100">{tenant?.email}</p>
          </div>


          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  Personal Information
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">Occupation:</span>
                    <span className="font-medium">{tenant?.occupation}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">Employment:</span>
                    <span className="font-medium">
                      {tenant?.employment_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  Lease Information
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">Property:</span>
                    <span className="font-medium">{tenant?.property_name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">Start Date:</span>
                    <span className="font-medium">
                      {new Date(tenant?.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 w-32">End Date:</span>
                    <span className="font-medium">
                      {new Date(tenant?.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-700 border-b pb-2">
              Payment History
            </h3>
            {paymentHistory.length === 0 ? (
                <p className="text-gray-500">No payment records found.</p>
            ) : (
                <div className="mt-2 w-full overflow-x-auto">
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
                      muiTablePaperProps={{ sx: { width: "100%" } }}
                  />
                </div>
            )}
          </div>


        </div>
      </div>
    </LandlordLayout>
  );
}
