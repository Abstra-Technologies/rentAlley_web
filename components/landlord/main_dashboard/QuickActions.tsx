"use client";

import { Home, UserPlus, Megaphone, List, Wallet } from "lucide-react";

export default function QuickActions({
                                         onAddProperty,
                                         onInviteTenant,
                                         onAnnouncement,
                                         onWorkOrder,
                                         onIncome,
                                     }) {
    const actions = [
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

    return (
        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 md:gap-4">
            {actions.map(
                ({ id, label, icon: Icon, onClick, gradientFrom, gradientTo }) => (
                    <button
                        key={id}
                        onClick={onClick}
                        className="group flex flex-col items-center w-16 md:w-20"
                    >
                        {/* Icon Circle */}
                        <div
                            className="
                w-12 h-12 md:w-14 md:h-14
                rounded-full
                flex items-center justify-center
                bg-white border border-gray-200
                shadow-sm
                transition-all duration-200
                group-hover:shadow-lg group-hover:scale-110 group-hover:border-transparent
                relative overflow-hidden
              "
                        >
                            {/* Gradient Overlay */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{
                                    background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`,
                                }}
                            />

                            {/* Icon */}
                            <Icon className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-white transition-colors duration-200 relative z-10" />
                        </div>

                        {/* Label — no wrapping */}
                        <span className="mt-1.5 text-[10px] md:text-xs font-medium text-gray-700 text-center leading-tight whitespace-nowrap">
              {label}
            </span>
                    </button>
                )
            )}
        </div>
    );
}
