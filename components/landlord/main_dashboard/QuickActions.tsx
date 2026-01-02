"use client";

import Link from "next/link";
import {
    Home,
    UserPlus,
    Megaphone,
    List,
    Wallet,
    Building,
    Users,
    MessageSquareMore,
    Calendar,
    Construction,
    ReceiptText

} from "lucide-react";

export default function QuickActions({
                                         onAddProperty,
                                         onInviteTenant,
                                         onAnnouncement,
                                         onWorkOrder,
                                         onIncome,
                                     }: {
    onAddProperty: () => void;
    onInviteTenant: () => void;
    onAnnouncement: () => void;
    onWorkOrder: () => void;
    onIncome: () => void;
}) {
    /* ================================
       DESKTOP QUICK ACTIONS (Original)
    ================================= */
    const desktopActions = [
        {
            id: "addProperty",
            label: "Add Property",
            icon: Home,
            onClick: onAddProperty,
            gradientFrom: "#3b82f6",
            gradientTo: "#2563eb",
        },
        {
            id: "inviteTenant",
            label: "Invite Tenant",
            icon: UserPlus,
            onClick: onInviteTenant,
            gradientFrom: "#10b981",
            gradientTo: "#059669",
        },
        {
            id: "announcement",
            label: "Announcement",
            icon: Megaphone,
            onClick: onAnnouncement,
            gradientFrom: "#a855f7",
            gradientTo: "#9333ea",
        },
        {
            id: "workOrder",
            label: "Work Order",
            icon: List,
            onClick: onWorkOrder,
            gradientFrom: "#f97316",
            gradientTo: "#ea580c",
        },
        {
            id: "income",
            label: "Income",
            icon: Wallet,
            onClick: onIncome,
            gradientFrom: "#2563eb",
            gradientTo: "#10b981",
        },
    ];

    /* ================================
       MOBILE MENU (GCash-style)
    ================================= */
    const mobileActions = [
        {
            label: "Income",
            href: "/pages/landlord/payouts",
            icon: Wallet ,
        },
        {
            label: "Properties",
            href: "/pages/landlord/property-listing",
            icon: Building,
        },
        {
            label: "My Tenants",
            href: "/pages/landlord/list_of_tenants",
            icon: Users,
        },
        {
            label: "Announcements",
            href: "/pages/landlord/announcement",
            icon: Megaphone,
        },
        {
            label: "Messages",
            href: "/pages/landlord/chat",
            icon: MessageSquareMore,
        },
        {
            label: "Calendar",
            href: "/pages/landlord/booking-appointment",
            icon: Calendar,
        },
        {
            label: "Transactions",
            href: "/pages/landlord/payments",
            icon:     ReceiptText
            ,
        },
        {
            label: "Work Orders",
            href: "/pages/landlord/maintenance-request",
            icon: Construction,
        },
    ];

    return (
        <>
            {/* ================= MOBILE (GCash style) ================= */}
            <div className="grid grid-cols-4 gap-4 md:hidden">
                {mobileActions.map(({ label, href, icon: Icon }) => (
                    <Link
                        key={label}
                        href={href}
                        className="flex flex-col items-center gap-1 active:scale-95 transition"
                    >
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                            <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-[10px] text-gray-700 font-medium text-center leading-tight">
              {label}
            </span>
                    </Link>
                ))}
            </div>

            {/* ================= DESKTOP (Original) ================= */}
            <div className="hidden md:flex flex-wrap justify-start items-center gap-4">
                {desktopActions.map(
                    ({ id, label, icon: Icon, onClick, gradientFrom, gradientTo }) => (
                        <button
                            key={id}
                            onClick={onClick}
                            className="group flex flex-col items-center w-20"
                        >
                            <div
                                className="
                  w-14 h-14 rounded-full
                  flex items-center justify-center
                  bg-white border border-gray-200
                  shadow-sm
                  transition-all duration-200
                  group-hover:shadow-lg group-hover:scale-110
                  relative overflow-hidden
                "
                            >
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{
                                        background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`,
                                    }}
                                />

                                <Icon className="w-6 h-6 text-gray-700 group-hover:text-white relative z-10 transition-colors" />
                            </div>

                            <span className="mt-2 text-xs font-medium text-gray-700 whitespace-nowrap">
                {label}
              </span>
                        </button>
                    )
                )}
            </div>
        </>
    );
}
