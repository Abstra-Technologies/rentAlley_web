"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    MaterialReactTable,
    type MRT_ColumnDef,
} from "material-react-table";
import Swal from "sweetalert2";
import { IoMailOpen } from "react-icons/io5";

import LoadingScreen from "../../loadingScreen";
import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";
import { decryptData } from "@/crypto/encrypt";

type Tenant = {
    tenant_id: number;
    firstName: string;
    lastName: string;
    email: string;
    employment_type: string;
    occupation: string;
    units: { unit_id: number; unit_name: string }[];
    property_names: string[];
    agreements: {
        agreement_id: number;
        start_date: string;
        end_date: string;
        lease_status: string;
    }[];
};

export default function TenantList({ landlord_id }: { landlord_id: number }) {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user, admin, fetchSession } = useAuthStore();

    useEffect(() => {
        if (!landlord_id) return;

        fetch(`/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setTenants(data);
                } else {
                    setTenants([]);
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching tenants:", error);
                setError("Failed to load tenants.");
                setLoading(false);
            });
    }, [landlord_id]);

    useEffect(() => {
        if (!user && !admin) fetchSession();
    }, [user, admin, fetchSession]);

    // 🔹 Message Tenant Handler
    const handleMessageTenant = useCallback(
        (tenant: Tenant) => {
            try {
                if (!tenant?.tenant_id || !user?.landlord_id) {
                    Swal.fire({
                        icon: "error",
                        title: "Unable to Message Tenant",
                        text: "Tenant information is not available.",
                        customClass: { popup: "rounded-xl" },
                    });
                    return;
                }

                const decryptedFirstName =
                    tenant.firstName.startsWith("{") || tenant.firstName.startsWith("[")
                        ? decryptData(JSON.parse(tenant.firstName), process.env.ENCRYPTION_SECRET)
                        : tenant.firstName;

                const decryptedLastName =
                    tenant.lastName.startsWith("{") || tenant.lastName.startsWith("[")
                        ? decryptData(JSON.parse(tenant.lastName), process.env.ENCRYPTION_SECRET)
                        : tenant.lastName;

                const tenantFullName = `${decryptedFirstName} ${decryptedLastName}`.trim();
                const chatRoom = `chat_${[user.user_id, tenant.tenant_id].sort().join("_")}`;

                const setChatData = useChatStore.getState().setPreselectedChat;
                setChatData({
                    chat_room: chatRoom,
                    landlord_id: user.landlord_id,
                    tenant_id: tenant.tenant_id,
                    name: tenantFullName,
                });

                Swal.fire({
                    title: "Opening Chat...",
                    text: `Starting chat with ${tenantFullName}`,
                    icon: "info",
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: "rounded-xl" },
                    didClose: () => router.push("/pages/landlord/chat"),
                });
            } catch (err) {
                console.error("Error preparing tenant chat:", err);
                Swal.fire({
                    icon: "error",
                    title: "Chat Error",
                    text: "Failed to initiate chat with tenant.",
                    customClass: { popup: "rounded-xl" },
                });
            }
        },
        [router, user]
    );

    // 🔹 View Tenant Details
    const handleViewDetails = (tenant_id: number) => {
        router.push(`/pages/landlord/list_of_tenants/${tenant_id}`);
    };

    const columns: MRT_ColumnDef<Tenant>[] = [
        {
            accessorKey: "firstName",
            header: "Tenant Name",
            Cell: ({ row }) => (
                <span className="font-medium text-gray-800">
          {row.original.firstName} {row.original.lastName}
        </span>
            ),
        },
        { accessorKey: "email", header: "Email" },
        {
            id: "property_names",
            header: "Property",
            Cell: ({ row }) =>
                row.original.property_names?.length
                    ? row.original.property_names.join(", ")
                    : "—",
        },
        {
            id: "units",
            header: "Units Occupied",
            Cell: ({ row }) =>
                row.original.units?.length
                    ? row.original.units.map((u) => u.unit_name).join(", ")
                    : "—",
        },

        {
            id: "actions",
            header: "Actions",
            Cell: ({ row }) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleViewDetails(row.original.tenant_id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                    >
                        View Details
                    </button>

                    <button
                        onClick={() => handleMessageTenant(row.original)}
                        className="px-3 py-1 flex items-center gap-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition"
                    >
                        <IoMailOpen className="text-white w-4 h-4" />
                        Message
                    </button>
                </div>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
                <LoadingScreen message="Fetching your current tenants, please wait..." />
            </div>
        );
    }

    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="w-full px-4 py-6 lg:px-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="gradient-header">My Tenants</h1>

                <MaterialReactTable
                    columns={columns}
                    data={tenants}
                    enableSorting
                    enableColumnActions={false}
                    enableDensityToggle={false}
                    initialState={{
                        pagination: { pageSize: 10, pageIndex: 0 },
                    }}
                    muiTableBodyRowProps={{
                        sx: {
                            "&:hover": {
                                backgroundColor: "#f9fafb",
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
}
