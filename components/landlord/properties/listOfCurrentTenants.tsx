"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { IoMailOpen } from "react-icons/io5";
import { UserCircle2, Building2, Search, Home, User, UserPlus } from "lucide-react";
import Pagination from "@/components/Commons/Pagination";
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
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const itemsPerPage = 6;

    const router = useRouter();
    const { user, admin, fetchSession } = useAuthStore();

    useEffect(() => {
        if (!landlord_id) return;
        fetch(`/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}`)
            .then((res) => res.json())
            .then((data) => {
                setTenants(Array.isArray(data) ? data : []);
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

    // 🔹 Message Tenant
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

    // 🔹 Redirect to Invite Tenant Page
    const handleInviteTenant = () => {
        router.push("/pages/landlord/invite-tenant");
    };

    // 🔍 Filter tenants
    const filteredTenants = useMemo(() => {
        return tenants.filter((tenant) => {
            const query = searchQuery.toLowerCase();
            const name = `${tenant.firstName} ${tenant.lastName}`.toLowerCase();
            const email = tenant.email?.toLowerCase() || "";
            const property = tenant.property_names?.join(", ").toLowerCase() || "";
            return name.includes(query) || email.includes(query) || property.includes(query);
        });
    }, [tenants, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const currentTenants = filteredTenants.slice(startIndex, startIndex + itemsPerPage);

    if (loading)
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
                <LoadingScreen message="Fetching your current tenants, please wait..." />
            </div>
        );

    if (error)
        return <div className="text-center py-12 text-red-500 font-medium">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 pt-20 pb-4 md:pt-6 md:pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Tenants</h1>
                            <p className="text-gray-600 text-sm">Manage and view your active tenants</p>
                        </div>
                    </div>

                    {/* Right Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:items-center">
                        {/* Search Bar */}
                        <div className="relative max-w-xs w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tenants..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition text-sm"
                            />
                        </div>

                        {/* ✅ Invite Tenant Button */}
                        <button
                            onClick={handleInviteTenant}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            <UserPlus className="w-4 h-4" />
                            Invite Tenant
                        </button>
                    </div>
                </div>
            </div>

            {/* Tenant Grid */}
            <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-5">
                {currentTenants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentTenants.map((tenant) => {
                            const tenantName = `${tenant.firstName} ${tenant.lastName}`;
                            const propertyList = tenant.property_names?.join(", ") || "—";
                            const unitList = tenant.units?.map((u) => u.unit_name).join(", ") || "—";

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
                                            <h2 className="text-lg font-semibold text-gray-800 truncate">{tenantName}</h2>
                                            <p className="text-sm text-gray-500 truncate">{tenant.email}</p>
                                        </div>
                                    </div>

                                    {/* Property & Units */}
                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium text-gray-700">{propertyList}</span>
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
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center">
                                <UserCircle2 className="h-10 w-10 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {searchQuery ? "No matching tenants" : "No tenants found"}
                            </h3>
                            <p className="text-sm text-gray-600 mb-5">
                                {searchQuery
                                    ? "Try adjusting your search to find a tenant."
                                    : "You currently don’t have any active tenants."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {filteredTenants.length > itemsPerPage && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalItems={filteredTenants.length}
                        itemsPerPage={itemsPerPage}
                    />
                )}
            </div>
        </div>
    );
}
