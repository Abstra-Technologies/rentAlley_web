"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
import {
    Eye,
    Users,
    Mail,
    Phone,
    Building2,
    CheckCircle,
    XCircle,
    Clock,
    MoreVertical,
    MessageCircle,
    Archive,
} from "lucide-react";
import useAuthStore from "@/zustand/authStore";

/* =====================================================
   TYPES
===================================================== */
type TenantStatus = "pending" | "approved" | "disapproved";

interface Tenant {
    id: number;
    tenant_id: number;
    unit_id: number;
    user_id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    profilePicture?: string;
    unit_name?: string;
    status: TenantStatus;
}

/* =====================================================
   PAGE
===================================================== */
export default function InterestedTenants({
                                              propertyId,
                                          }: {
    propertyId: number;
}) {
    const router = useRouter();
    const { fetchSession, user } = useAuthStore();

    const [tab, setTab] = useState<"active" | "archived">("active");
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    /* =====================================================
       SESSION
    ===================================================== */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /* =====================================================
       FETCH
    ===================================================== */
    const fetchTenants = async () => {
        try {
            setLoading(true);
            const res = await axios.get(
                `/api/landlord/prospective/interestedTenants?propertyId=${propertyId}`
            );
            setTenants(res.data || []);
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to load tenants");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (propertyId) fetchTenants();
    }, [propertyId]);

    /* =====================================================
       CLOSE MENU ON OUTSIDE CLICK
    ===================================================== */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* =====================================================
       ACTIONS
    ===================================================== */
    const handleView = (t: Tenant) => {
        router.push(
            `/pages/landlord/properties/${propertyId}/prospectives/details?tenant_id=${t.tenant_id}&unit_id=${t.unit_id}`
        );
    };

    const updateStatus = async (t: Tenant, status: TenantStatus) => {
        await axios.put("/api/landlord/prospective/updateStatus", {
            id: t.id,
            status,
        });
        fetchTenants();
    };

    const archiveTenant = async (t: Tenant) => {
        const res = await Swal.fire({
            title: "Remove from list?",
            text: "This will move the applicant to Archived.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Remove",
        });

        if (!res.isConfirmed) return;

        await axios.put("/api/landlord/prospective/archive", { id: t.id });
        fetchTenants();
    };

    /* =====================================================
       FILTER BY TAB (NO NEW API)
    ===================================================== */
    const filteredTenants = tenants.filter((t) =>
        tab === "active" ? t.status !== "disapproved" : t.status === "disapproved"
    );

    /* =====================================================
       UI HELPERS
    ===================================================== */
    const statusBadge = (status: TenantStatus) => {
        const base =
            "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border";
        if (status === "approved")
            return (
                <span className={`${base} bg-emerald-50 text-emerald-700`}>
          <CheckCircle className="w-3 h-3" /> Approved
        </span>
            );
        if (status === "disapproved")
            return (
                <span className={`${base} bg-red-50 text-red-700`}>
          <XCircle className="w-3 h-3" /> Archived
        </span>
            );
        return (
            <span className={`${base} bg-amber-50 text-amber-700`}>
        <Clock className="w-3 h-3" /> Pending
      </span>
        );
    };

    /* =====================================================
       STATES
    ===================================================== */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Loading prospective tenants…
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-600">
                {error}
            </div>
        );
    }

    /* =====================================================
       RENDER
    ===================================================== */
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* HEADER */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                    Prospective Tenants
                </h1>
            </div>

            {/* TABS */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setTab("active")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                        tab === "active"
                            ? "bg-blue-600 text-white"
                            : "bg-white border text-gray-600"
                    }`}
                >
                    Active
                </button>
                <button
                    onClick={() => setTab("archived")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                        tab === "archived"
                            ? "bg-gray-700 text-white"
                            : "bg-white border text-gray-600"
                    }`}
                >
                    Archived
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl border shadow-sm overflow-visible">
                <table className="min-w-full divide-y">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                    <tr>
                        <th className="px-4 py-3 text-left">Tenant</th>
                        <th className="px-4 py-3 text-left">Contact</th>
                        <th className="px-4 py-3 text-left">Unit</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y">
                    {filteredTenants.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 flex items-center gap-3">
                                <Image
                                    src={
                                        t.profilePicture ||
                                        "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                                    }
                                    alt="Profile"
                                    width={40}
                                    height={40}
                                    className="rounded-full border"
                                />
                                <span className="font-semibold">
                    {t.firstName} {t.lastName}
                  </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                                <div>{t.email}</div>
                                <div className="text-xs text-gray-500">{t.phoneNumber}</div>
                            </td>
                            <td className="px-4 py-3">{t.unit_name || "—"}</td>
                            <td className="px-4 py-3">{statusBadge(t.status)}</td>
                            <td className="px-4 py-3 text-center">
                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => handleView(t)}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs flex items-center gap-1"
                                    >
                                        <Eye className="w-4 h-4" /> View
                                    </button>

                                    {tab === "active" && (
                                        <ActionMenu
                                            tenant={t}
                                            openMenuId={openMenuId}
                                            setOpenMenuId={setOpenMenuId}
                                            menuRef={menuRef}
                                            updateStatus={updateStatus}
                                            archive={archiveTenant}
                                            router={router}
                                        />
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}

                    {filteredTenants.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                                No tenants found.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* =====================================================
   ACTION MENU
===================================================== */
function ActionMenu({
                        tenant,
                        openMenuId,
                        setOpenMenuId,
                        menuRef,
                        updateStatus,
                        archive,
                        router,
                    }: any) {
    const isOpen = openMenuId === tenant.id;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(isOpen ? null : tenant.id);
                }}
                className="p-2 rounded-lg border hover:bg-gray-100"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {isOpen && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl z-50"
                >
                    <button
                        onClick={() => router.push(`/chat/${tenant.user_id}`)}
                        className="w-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50"
                    >
                        <MessageCircle className="w-4 h-4" /> Message
                    </button>

                    {tenant.status === "pending" && (
                        <>
                            <button
                                onClick={() => updateStatus(tenant, "approved")}
                                className="w-full px-4 py-2 text-sm text-emerald-600 hover:bg-gray-50"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => updateStatus(tenant, "disapproved")}
                                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                            >
                                Reject
                            </button>
                        </>
                    )}

                    <div className="border-t my-1" />

                    <button
                        onClick={() => archive(tenant)}
                        className="w-full px-4 py-2 text-sm text-red-600 flex items-center gap-2 hover:bg-red-50"
                    >
                        <Archive className="w-4 h-4" /> Remove from list
                    </button>
                </div>
            )}
        </div>
    );
}
