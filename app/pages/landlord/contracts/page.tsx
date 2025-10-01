
"use client";
import { useEffect, useState } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Box, Typography } from "@mui/material";
import useAuthStore from "../../../../zustand/authStore";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import LeaseStatusInfo from "@/components/landlord/widgets/LeaseStatusInfo";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { IconButton, Tooltip } from "@mui/material";
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

                let color = "gray";
                let bg = "#f3f4f6";

                if (status === "active") {
                    color = "#16a34a"; // green
                    bg = "#dcfce7";
                } else if (status === "pending") {
                    color = "#d97706"; // orange
                    bg = "#fef3c7";
                } else if (status === "expired") {
                    color = "#dc2626"; // red
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

                if (tenantStatus === "signed" && landlordStatus === "signed") {
                    return "complete";
                } else if (landlordStatus === "signed" && tenantStatus !== "signed") {
                    return "landlord signed, waiting for tenant";
                } else if (tenantStatus === "declined") {
                    return "declined";
                } else {
                    return tenantStatus;
                }
            },
            id: "signature_status",
            header: "Signature Status",
            Cell: ({ cell }) => {
                const status = cell.getValue<string>() || "pending";

                let color = "gray";
                let bg = "#f3f4f6";

                if (status === "complete") {
                    color = "#16a34a"; // green
                    bg = "#dcfce7";
                } else if (status === "landlord signed, waiting for tenant" || status === "pending") {
                    color = "#d97706"; // orange
                    bg = "#fef3c7";
                } else if (status === "declined") {
                    color = "#dc2626"; // red
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
                        {status.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
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
                    <h1 className="gradient-header">Active Lease Agreements</h1>
                    <p className="gradient-subtitle">
                        Efficiently oversee, track, and manage all your lease agreements within a centralized platform.
                    </p>
                </div>

                <LeaseStatusInfo />

                <Box p={3}>
                    <MaterialReactTable
                        columns={columns}
                        data={data}
                        state={{ isLoading: loading }}
                        muiTablePaperProps={{
                            elevation: 3,
                            sx: { borderRadius: "12px" },
                        }}
                    />
                </Box>
            </LandlordLayout>
        </div>
    );
}