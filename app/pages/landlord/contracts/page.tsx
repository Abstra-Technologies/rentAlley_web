"use client";
import { useEffect, useState } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Box, Typography, useMediaQuery, IconButton, Tooltip } from "@mui/material";
import useAuthStore from "../../../../zustand/authStore";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import LeaseStatusInfo from "@/components/landlord/widgets/LeaseStatusInfo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useRouter } from "next/navigation";

type Contact = {
    user_id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    property_name: string;
    unit_name: string;
    lease_status: string;
    agreement_url: string;
    tenant_signature_status: string | null;
    landlord_signature_status: string | null;
    agreement_id: number;
};

export default function ContactsPage() {
    const [data, setData] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const isMobile = useMediaQuery("(max-width: 640px)");
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user?.landlord_id) return;

        const fetchData = async () => {
            try {
                const res = await fetch(
                    `/api/landlord/properties/getCurrentTenants?landlord_id=${user?.landlord_id}`
                );
                const tenants = await res.json();
                setData(tenants);
            } catch (err) {
                console.error("Error fetching contacts:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.landlord_id]);

    const columns: MRT_ColumnDef<Contact>[] = [
        {
            accessorFn: (row) => `${row.property_name} - ${row.unit_name}`,
            id: "propertyUnit",
            header: "Property / Unit",
        },
        {
            accessorKey: "lease_status",
            header: "Lease Status",
            Cell: ({ cell }) => {
                const status = cell.getValue<string>() || "unknown";
                let color = "gray",
                    bg = "#f3f4f6";
                if (status === "active") {
                    color = "#16a34a";
                    bg = "#dcfce7";
                } else if (status === "pending") {
                    color = "#d97706";
                    bg = "#fef3c7";
                } else if (status === "expired") {
                    color = "#dc2626";
                    bg = "#fee2e2";
                }
                return (
                    <span
                        style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            color,
                            backgroundColor: bg,
                        }}
                    >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
                );
            },
        },
        {
            accessorFn: (row) => {
                const tenantStatus = row.tenant_signature_status || "pending";
                const landlordStatus = row.landlord_signature_status || "pending";
                if (tenantStatus === "signed" && landlordStatus === "signed") return "complete";
                if (landlordStatus === "signed" && tenantStatus !== "signed")
                    return "landlord signed, waiting for tenant";
                if (tenantStatus === "declined") return "declined";
                return tenantStatus;
            },
            id: "signature_status",
            header: "Signature Status",
            Cell: ({ cell }) => {
                const status = cell.getValue<string>() || "pending";
                let color = "gray",
                    bg = "#f3f4f6";
                if (status === "complete") {
                    color = "#16a34a";
                    bg = "#dcfce7";
                } else if (
                    status === "landlord signed, waiting for tenant" ||
                    status === "pending"
                ) {
                    color = "#d97706";
                    bg = "#fef3c7";
                } else if (status === "declined") {
                    color = "#dc2626";
                    bg = "#fee2e2";
                }
                return (
                    <span
                        style={{
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            color,
                            backgroundColor: bg,
                        }}
                    >
            {status
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
          </span>
                );
            },
        },
        {
            accessorKey: "agreement_url",
            header: "Agreement URL",
            Cell: ({ cell }) => {
                const url = cell.getValue<string>();
                return url ? (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        View
                    </a>
                ) : (
                    <span className="text-gray-400 italic">N/A</span>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            Cell: ({ row }) => (
                <Tooltip title="View More">
                    <IconButton
                        onClick={() => router.push(`/pages/lease/${row.original?.agreement_id}`)}
                        color="primary"
                    >
                        <VisibilityIcon />
                    </IconButton>
                </Tooltip>
            ),
        },
    ];

    return (
        <div className="min-h-screen">
            <LandlordLayout>
                <div className="mb-6">
                    <h1 className="gradient-header text-lg sm:text-2xl">Active Lease Agreements</h1>
                    <p className="gradient-subtitle text-sm sm:text-base">
                        Efficiently oversee, track, and manage all your lease agreements in one place.
                    </p>
                </div>

                <LeaseStatusInfo />

                {isMobile ? (
                    // 📱 MOBILE CARD VIEW
                    <div className="space-y-4 mt-6">
                        {loading ? (
                            <p className="text-gray-500 text-center">Loading...</p>
                        ) : data.length === 0 ? (
                            <p className="text-gray-500 text-center">No active leases found.</p>
                        ) : (
                            data.map((tenant, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-xl shadow-md border border-gray-100 p-4 transition hover:shadow-lg"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-semibold text-gray-800 text-sm">
                                            {tenant.property_name} — {tenant.unit_name}
                                        </p>
                                        <IconButton
                                            size="small"
                                            onClick={() => router.push(`/pages/lease/${tenant.agreement_id}`)}
                                        >
                                            <VisibilityIcon className="text-blue-600" fontSize="small" />
                                        </IconButton>
                                    </div>

                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>
                                            <span className="font-medium text-gray-700">Lease:</span>{" "}
                                            <span
                                                className={`font-semibold ${
                                                    tenant.lease_status === "active"
                                                        ? "text-green-600"
                                                        : tenant.lease_status === "pending"
                                                            ? "text-amber-600"
                                                            : "text-red-600"
                                                }`}
                                            >
                        {tenant.lease_status}
                      </span>
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-700">Signature:</span>{" "}
                                            {tenant.tenant_signature_status === "signed" &&
                                            tenant.landlord_signature_status === "signed" ? (
                                                <span className="text-green-600 font-semibold">Complete</span>
                                            ) : tenant.tenant_signature_status === "declined" ? (
                                                <span className="text-red-600 font-semibold">Declined</span>
                                            ) : (
                                                <span className="text-amber-600 font-semibold">Pending</span>
                                            )}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-700">Tenant:</span>{" "}
                                            {tenant.firstName} {tenant.lastName}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-700">Email:</span>{" "}
                                            {tenant.email || <span className="italic text-gray-400">N/A</span>}
                                        </p>
                                        {tenant.agreement_url && (
                                            <p>
                                                <a
                                                    href={tenant.agreement_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 font-medium hover:underline"
                                                >
                                                    View Agreement
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    // 💻 DESKTOP TABLE VIEW
                    <Box p={3} className="overflow-x-auto">
                        <MaterialReactTable
                            columns={columns}
                            data={data}
                            state={{ isLoading: loading }}
                            enableFullScreenToggle={false}
                            enableDensityToggle={false}
                            muiTablePaperProps={{
                                elevation: 3,
                                sx: { borderRadius: "12px" },
                            }}
                        />
                    </Box>
                )}
            </LandlordLayout>
        </div>
    );
}
