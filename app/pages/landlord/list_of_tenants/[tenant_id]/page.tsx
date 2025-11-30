"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { User, Briefcase, Calendar, MapPin, CreditCard } from "lucide-react";
import LoadingScreen from "@/components/loadingScreen";
import {BackButton} from "@/components/navigation/backButton";

export default function TenantDetails() {
    const params = useParams();
    const tenant_id = params?.tenant_id;
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenant_id) return;

        let isMounted = true; // prevent state updates after unmount

        const fetchTenantDetails = async () => {
            try {
                const res = await fetch(
                    `/api/landlord/properties/getCurrentTenants/viewDetail/${tenant_id}`
                );

                if (!res.ok) {
                    console.error("Failed to fetch tenant details:", res.status);
                    if (isMounted) setLoading(false);
                    return;
                }

                const data = await res.json();

                if (isMounted) {
                    setTenant(data?.tenant || null);
                    setPaymentHistory(data?.paymentHistory || []);
                    setLoading(false);
                }

                console.log('tenant data: ', data?.tenant);

            } catch (error) {
                console.error("Error fetching tenant details:", error);
                if (isMounted) setLoading(false);
            }
        };

        fetchTenantDetails();

        return () => {
            isMounted = false;
        };
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
                    <div className="mb-4">
                        <BackButton label="Back to Tenants" />
                    </div>

                    <div className="bg-gradient-to-r from-blue-600 to-emerald-600 p-5 md:p-6 text-white">
                        <div className="flex items-start gap-4">

                            <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-white/20 backdrop-blur-sm">
                                {tenant?.profilePicture ? (
                                    <img
                                        src={tenant.profilePicture}
                                        alt="Tenant Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/20">
                                        <User className="w-7 h-7 text-white" />
                                    </div>
                                )}
                            </div>
                            {/* END Avatar */}

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

                    {/* Information Grid of Tenant */}
                    <div className="p-4 md:p-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                            {/* Personal Info */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center shadow-md">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                                </div>

                                <div className="space-y-2">
                                    {/* Full Name */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 p-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-semibold text-gray-600 sm:w-32">
            Full Name:
          </span>
                                        <span className="font-medium text-gray-900">
            {tenant?.firstName} {tenant?.lastName}
          </span>
                                    </div>

                                    {/* Email */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 p-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-semibold text-gray-600 sm:w-32">
            Email:
          </span>
                                        <span className="font-medium text-gray-900 break-all">
            {tenant?.email}
          </span>
                                    </div>

                                    {/* Phone */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 p-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-semibold text-gray-600 sm:w-32">
            Phone:
          </span>
                                        <span className="font-medium text-gray-900">
            {tenant?.phoneNumber || "—"}
          </span>
                                    </div>

                                    {/* Citizenship */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 p-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-semibold text-gray-600 sm:w-32">
            Citizenship:
          </span>
                                        <span className="font-medium text-gray-900">
            {tenant?.citizenship || "—"}
          </span>
                                    </div>
                                </div>
                            </div>

                            {/* Employment Info */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                    <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg flex items-center justify-center shadow-md">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900">Employment Details</h2>
                                </div>

                                <div className="space-y-2">

                                    {/* Occupation */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 p-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-semibold text-gray-600 sm:w-32">
            Occupation:
          </span>
                                        <span className="font-medium text-gray-900">
            {tenant?.occupation || "—"}
          </span>
                                    </div>

                                    {/* Employment Type */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 p-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-semibold text-gray-600 sm:w-32">
            Employment Type:
          </span>
                                        <span className="font-medium text-gray-900">
            {tenant?.employment_type || "—"}
          </span>
                                    </div>

                                    {/* Monthly Income (if available) */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 p-2 bg-gray-50 rounded-lg">
          <span className="text-xs font-semibold text-gray-600 sm:w-32">
            Income:
          </span>
                                        <span className="font-medium text-gray-900">
            {tenant?.monthly_income || "—"}
          </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
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
