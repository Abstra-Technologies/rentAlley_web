"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { IoMailOpen } from "react-icons/io5";
import { UserCircle2, Home, Building2 } from "lucide-react";

import LoadingScreen from "../../loadingScreen";
import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";
import { decryptData } from "@/crypto/encrypt";

type Tenant = {
    tenant_id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
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

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
                <LoadingScreen message="Fetching your current tenants, please wait..." />
            </div>
        );
    }

    if (error) return <p className="text-red-500">{error}</p>;

    if (tenants.length === 0) {
        return (
            <div className="text-center py-16">
                <UserCircle2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h2 className="text-lg font-semibold text-gray-700">
                    No tenants found
                </h2>
                <p className="text-sm text-gray-500">
                    You currently don’t have any active tenants.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full px-4 py-6 lg:px-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="gradient-header mb-6">My Tenants</h1>

                {/* Responsive Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tenants.map((tenant) => {
                        const tenantName = `${tenant.firstName} ${tenant.lastName}`;
                        const propertyList = tenant.property_names?.join(", ") || "—";
                        const unitList =
                            tenant.units?.map((u) => u.unit_name).join(", ") || "—";

                        return (
                            <div
                                key={tenant.tenant_id}
                                className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-gray-100 p-5 transition-all duration-200 flex flex-col justify-between"
                            >
                                {/* Profile Section */}
                                <div className="flex items-center gap-4 mb-4">
                                    {tenant.profilePicture ? (
                                        <img
                                            src={tenant.profilePicture}
                                            alt={tenantName}
                                            className="w-14 h-14 rounded-full object-cover border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                                            {tenant.firstName?.[0]?.toUpperCase() || "?"}
                                        </div>
                                    )}

                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800 truncate">
                                            {tenantName}
                                        </h2>
                                        <p className="text-sm text-gray-500 truncate">
                                            {tenant.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Property & Units Info */}
                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-500" />
                                        <span className="font-medium text-gray-700">
                      {propertyList}
                    </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Home className="w-4 h-4 text-emerald-500" />
                                        <span>{unitList}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-between gap-2 mt-auto">
                                    <button
                                        onClick={() => handleViewDetails(tenant.tenant_id)}
                                        className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => handleMessageTenant(tenant)}
                                        className="flex-1 px-3 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-200"
                                    >
                                        <IoMailOpen className="w-4 h-4" /> Message
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
