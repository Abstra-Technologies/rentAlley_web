"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { IoMailOpen } from "react-icons/io5";
import {
  UserCircle2,
  Building2,
  Search,
  Home,
  User,
  UserPlus,
} from "lucide-react";
import Pagination from "@/components/Commons/Pagination";
import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";

type Tenant = {
  tenant_id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  units: { unit_id: number; unit_name: string }[];
  property_names: string[];
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

  // FETCH TENANTS
  useEffect(() => {
    if (!landlord_id) return;

    fetch(
      `/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        setTenants(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load tenants.");
        setLoading(false);
      });
  }, [landlord_id]);

  // ENSURE USER SESSION
  useEffect(() => {
    if (!user && !admin) fetchSession();
  }, [user, admin, fetchSession]);

  // SEARCH FILTER
  const filteredTenants = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tenants.filter((t) => {
      return (
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.phoneNumber?.toLowerCase().includes(q) ||
        t.property_names.join(", ").toLowerCase().includes(q)
      );
    });
  }, [tenants, searchQuery]);

  // PAGINATION
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const currentTenants = filteredTenants.slice(
    (page - 1) * itemsPerPage,
    (page - 1) * itemsPerPage + itemsPerPage
  );

  // ACTIONS
  const handleMessageTenant = (tenant: Tenant) => {
    const chatRoom = `chat_${[user.user_id, tenant.tenant_id]
      .sort()
      .join("_")}`;
    useChatStore.getState().setPreselectedChat({
      chat_room: chatRoom,
      landlord_id: user.landlord_id,
      tenant_id: tenant.tenant_id,
      name: `${tenant.firstName} ${tenant.lastName}`,
    });

    router.push("/pages/landlord/chat");
  };

  const handleViewDetails = (id: number) =>
    router.push(`/pages/landlord/list_of_tenants/${id}`);

  const handleInviteTenant = () => router.push("/pages/landlord/invite-tenant");

  // ============================================
  // SKELETON LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* HEADER SKELETON */}
        <div className="bg-white border-b px-4 pt-10 pb-3 md:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Title Skeleton */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-1" />
                <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
              </div>
            </div>

            {/* Search + Invite Skeleton */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="h-10 bg-gray-200 rounded-lg w-full sm:w-64 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse" />
            </div>
          </div>
        </div>

        {/* TENANTS GRID SKELETON */}
        <div className="px-4 md:px-8 pt-4 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border rounded-xl p-3.5 flex flex-col items-center shadow-sm"
              >
                {/* Profile Skeleton */}
                <div className="flex flex-col items-center mb-2.5 w-full">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-40 animate-pulse mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-28 animate-pulse" />
                </div>

                {/* Property Skeleton */}
                <div className="w-full space-y-1 mb-3">
                  <div className="h-8 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded-md animate-pulse" />
                </div>

                {/* Buttons Skeleton */}
                <div className="flex gap-2 w-full">
                  <div className="flex-1 h-8 bg-gray-200 rounded-md animate-pulse" />
                  <div className="flex-1 h-8 bg-gray-200 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-500 font-semibold">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b px-4 pt-10 pb-3 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow">
              <User className="w-4 h-4 text-white" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                My Tenants
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage your active tenants
              </p>
            </div>
          </div>

          {/* Search + Invite */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tenants..."
                className="
                                w-full pl-9 pr-3 py-2
                                bg-gray-100 border rounded-lg text-sm
                                focus:bg-white focus:ring focus:ring-blue-200
                            "
              />
            </div>

            {/* Invite */}
            <button
              onClick={handleInviteTenant}
              className="
                            px-4 py-2
                            text-[11px] font-semibold
                            bg-gradient-to-r from-blue-600 to-emerald-600
                            text-white rounded-lg shadow
                            hover:shadow-md transition
                        "
            >
              <UserPlus className="inline w-4 h-4 mr-1" />
              Invite
            </button>
          </div>
        </div>
      </div>

      {/* TENANTS GRID */}
      <div className="px-4 md:px-8 pt-4 pb-16">
        {currentTenants.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTenants.map((tenant) => {
              const tenantName = `${tenant.firstName} ${tenant.lastName}`;
              const propertyList = tenant.property_names.join(", ") || "—";
              const unitList =
                tenant.units.map((u) => u.unit_name).join(", ") || "—";

              return (
                <div
                  key={tenant.tenant_id}
                  className="
                                    bg-white border rounded-xl p-3.5
                                    flex flex-col items-center
                                    shadow-sm
                                    transition-all
                                    hover:shadow-lg hover:-translate-y-[2px]
                                    hover:ring-1 hover:ring-blue-300/40
                                    active:scale-[0.98]
                                "
                >
                  {/* PROFILE */}
                  <div className="flex flex-col items-center mb-2.5">
                    {tenant.profilePicture ? (
                      <img
                        src={tenant.profilePicture}
                        className="w-12 h-12 rounded-xl object-cover border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 text-white flex items-center justify-center text-base font-bold">
                        {tenant.firstName[0]}
                      </div>
                    )}

                    <h2 className="mt-1 text-sm font-semibold text-center truncate w-full">
                      {tenantName}
                    </h2>

                    <p className="text-[11px] text-gray-500 truncate w-full text-center">
                      {tenant.email}
                    </p>

                    <p className="text-[11px] text-gray-500 truncate w-full text-center">
                      {tenant.phoneNumber || "No mobile"}
                    </p>
                  </div>

                  {/* PROPERTY */}
                  <div className="w-full space-y-1 text-[11px] mb-3">
                    <div className="flex gap-2 p-1.5 bg-blue-50 rounded-md">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{propertyList}</span>
                    </div>

                    <div className="flex gap-2 p-1.5 bg-emerald-50 rounded-md">
                      <Home className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{unitList}</span>
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => handleViewDetails(tenant.tenant_id)}
                      className="
                                            flex-1 py-1.5
                                            text-[11px] font-bold
                                            bg-blue-600 text-white
                                            rounded-md
                                            hover:bg-blue-700 transition
                                        "
                    >
                      Profile
                    </button>

                    <button
                      onClick={() => handleMessageTenant(tenant)}
                      className="
                                            flex-1 py-1.5
                                            text-[11px] font-bold
                                            bg-emerald-600 text-white
                                            rounded-md
                                            hover:bg-emerald-700
                                            flex items-center justify-center gap-1
                                            transition
                                        "
                    >
                      <IoMailOpen className="w-3 h-3" />
                      Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-semibold">
              {searchQuery
                ? "No tenants found matching your search."
                : "No tenants found."}
            </p>
          </div>
        )}

        {/* PAGINATION */}
        {filteredTenants.length > itemsPerPage && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredTenants.length}
            />
          </div>
        )}
      </div>
    </div>
  );
}
