
"use client";
import { useEffect, useState } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Box, Typography } from "@mui/material";
import useAuthStore from "../../../../zustand/authStore";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import LeaseStatusInfo from "@/components/landlord/widgets/LeaseStatusInfo";

type Contact = {
    user_id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    property_name: string;
    unit_name: string;
    lease_status: string;
};

export default function ContactsPage() {
    const [data, setData] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);

    const {user} = useAuthStore();

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
        // {
        //     accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        //     id: "fullName",
        //     header: "Tenant",
        // },
        // { accessorKey: "email", header: "Email" },
        {
            accessorFn: (row) => `${row.property_name} - ${row.unit_name}`,
            id: "propertyUnit",
            header: "Property / Unit",
        },
        {
            accessorKey: "lease_status",
            header: "Lease Status",
            Cell: ({ cell }) => {
                const status = cell.getValue<string>();

                let color = "gray";
                let bg = "#f3f4f6"; // light gray

                if (status === "active") {
                    color = "#16a34a"; // green-600
                    bg = "#dcfce7";   // green-100
                } else if (status === "pending") {
                    color = "#d97706"; // orange-600
                    bg = "#fef3c7";   // orange-100
                } else if (status === "expired") {
                    color = "#dc2626"; // red-600
                    bg = "#fee2e2";   // red-100
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
        }
    ];

    return (
        <LandlordLayout>
            <h1 className='gradient-hero'>
                Lease Contracts
            </h1>
            <LeaseStatusInfo />

        <Box p={3}>
            <MaterialReactTable
                columns={columns}
                data={data}
                state={{isLoading: loading}}
                muiTablePaperProps={{
                    elevation: 3,
                    sx: {borderRadius: "12px"},
                }}
            />
        </Box>

        </LandlordLayout>
    );
}