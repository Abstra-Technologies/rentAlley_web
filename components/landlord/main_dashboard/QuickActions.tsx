"use client";

import { useState } from "react";
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
    ReceiptText,
    UserPen,
    QrCode, // 🆕
} from "lucide-react";

import {
    GRADIENT_DOT,
    SECTION_HEADER,
    SECTION_TITLE,
} from "@/constant/design-constants";

import ScanUnitModal from "@/components/landlord/properties/units/ScanUnitModal";

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
    const [scanOpen, setScanOpen] = useState(false); // 🆕

    /* ================================
         DESKTOP QUICK ACTIONS
      ================================= */
    const desktopActions = [
        {
            id: "addProperty",
            label: "Add Property",
            icon: Home,
            onClick: onAddProperty,
            gradient: "from-blue-500 to-blue-600",
            iconColor: "text-blue-600",
        },
        {
            id: "inviteTenant",
            label: "Invite Tenant",
            icon: UserPlus,
            onClick: onInviteTenant,
            gradient: "from-emerald-500 to-emerald-600",
            iconColor: "text-emerald-600",
        },
        {
            id: "announcement",
            label: "Announcement",
            icon: Megaphone,
            onClick: onAnnouncement,
            gradient: "from-purple-500 to-purple-600",
            iconColor: "text-purple-600",
        },
        {
            id: "workOrder",
            label: "Work Order",
            icon: List,
            onClick: onWorkOrder,
            gradient: "from-orange-500 to-orange-600",
            iconColor: "text-orange-600",
        },
        {
            id: "income",
            label: "Payouts",
            icon: Wallet,
            onClick: onIncome,
            gradient: "from-cyan-500 to-cyan-600",
            iconColor: "text-cyan-600",
        },
    ];

    /* ================================
         MOBILE MENU ACTIONS
      ================================= */
    const mobileActions = [
        // {
        //     label: "Scan Unit",
        //     icon: QrCode,
        //     gradient: "from-slate-700 to-slate-900",
        //     onClick: () => setScanOpen(true),
        // },
        {
            label: "Payouts",
            href: "/pages/landlord/payouts",
            icon: Wallet,
            gradient: "from-cyan-500 to-blue-500",
        },
        {
            label: "My Profile",
            href: "/pages/commons/profile",
            icon: UserPen,
            gradient: "from-blue-500 to-indigo-500",
        },
        {
            label: "Properties",
            href: "/pages/landlord/property-listing",
            icon: Building,
            gradient: "from-emerald-500 to-teal-500",
        },
        {
            label: "My Tenants",
            href: "/pages/landlord/list_of_tenants",
            icon: Users,
            gradient: "from-purple-500 to-pink-500",
        },
        {
            label: "Announcements",
            href: "/pages/landlord/announcement",
            icon: Megaphone,
            gradient: "from-orange-500 to-red-500",
        },
        {
            label: "Messages",
            href: "/pages/landlord/chat",
            icon: MessageSquareMore,
            gradient: "from-green-500 to-emerald-500",
        },
        {
            label: "Calendar",
            href: "/pages/landlord/booking-appointment",
            icon: Calendar,
            gradient: "from-rose-500 to-pink-500",
        },
        {
            label: "Transactions",
            href: "/pages/landlord/payments",
            icon: ReceiptText,
            gradient: "from-amber-500 to-orange-500",
        },
        {
            label: "Work Orders",
            href: "/pages/landlord/maintenance-request",
            icon: Construction,
            gradient: "from-yellow-500 to-amber-500",
        },
    ];

    return (
        <>
            {/* ================= MOBILE VIEW ================= */}
            <div className="md:hidden">
                <div className={`${SECTION_HEADER} mb-4 px-4`}>
                    <span className={GRADIENT_DOT} />
                    <h2 className={SECTION_TITLE}>Quick Actions</h2>
                </div>

                <div className="grid grid-cols-3 gap-3 px-4">
                    {mobileActions.map(({ label, href, icon: Icon, gradient, onClick }) =>
                            onClick ? (
                                <button
                                    key={label}
                                    onClick={onClick}
                                    className="group flex flex-col items-center gap-2 p-3 rounded-xl
                           bg-white border border-gray-200 shadow-sm
                           ring-1 ring-gray-100 transition-all active:scale-95"
                                >
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient}
                              flex items-center justify-center shadow-inner`}
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-700 text-center">
                  {label}
                </span>
                                </button>
                            ) : (
                                <Link
                                    key={label}
                                    href={href!}
                                    className="group flex flex-col items-center gap-2 p-3 rounded-xl
                           bg-white border border-gray-200 shadow-sm"
                                >
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient}
                              flex items-center justify-center shadow-inner`}
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-700 text-center">
                  {label}
                </span>
                                </Link>
                            )
                    )}
                </div>
            </div>

            {/* ================= DESKTOP VIEW ================= */}
            <div className="hidden md:block">
                <div className="flex flex-wrap gap-6">
                    {desktopActions.map(
                        ({ id, label, icon: Icon, onClick, gradient, iconColor }) => (
                            <button
                                key={id}
                                onClick={onClick}
                                className="group flex flex-col items-center gap-2
                           transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <div className="relative w-14 h-14 rounded-2xl">
                                    <div className="absolute inset-0 bg-white border border-gray-200
                                  rounded-2xl shadow-sm ring-1 ring-gray-100
                                  group-hover:opacity-0 transition-opacity" />
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${gradient}
                                rounded-2xl shadow-lg opacity-0
                                group-hover:opacity-100 transition-opacity`}
                                    />
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <Icon
                                            className={`w-6 h-6 ${iconColor} group-hover:text-white`}
                                        />
                                    </div>
                                </div>
                                <span className="text-xs font-semibold text-gray-700">
                  {label}
                </span>
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* 🆕 Scan Unit Modal */}
            <ScanUnitModal
                isOpen={scanOpen}
                onClose={() => setScanOpen(false)}
            />
        </>
    );
}
