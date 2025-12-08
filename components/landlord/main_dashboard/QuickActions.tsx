"use client";

import { Home, UserPlus, Megaphone, List, Wallet } from "lucide-react";

export default function QuickActions({
                                         onAddProperty,
                                         onInviteTenant,
                                         onAnnouncement,
                                         onWorkOrder,
                                         onIncome,     // 🆕 NEW CALLBACK
                                     }) {
    const actions = [
        {
            id: "addProperty",
            label: "Add Property",
            icon: Home,
            onClick: onAddProperty,
        },
        {
            id: "inviteTenant",
            label: "Invite Tenant",
            icon: UserPlus,
            onClick: onInviteTenant,
        },
        {
            id: "announcement",
            label: "Announcement",
            icon: Megaphone,
            onClick: onAnnouncement,
        },
        {
            id: "work_order",
            label: "Work Order",
            icon: List,
            onClick: onWorkOrder,
        },
        {
            id: "income",
            label: "Income",       // 🆕 NEW LABEL
            icon: Wallet,          // 🆕 MONEY/INCOME ICON
            onClick: onIncome,     // 🆕 TRIGGER USER CALLBACK
        },
    ];

    return (
        <div
            className="
                w-full
                flex flex-wrap
                items-center justify-center
                gap-4 sm:gap-6 lg:gap-8
                py-3 px-2
            "
        >
            {actions.map(({ id, label, icon: Icon, onClick }) => (
                <button
                    key={id}
                    onClick={onClick}
                    className="
                        flex flex-col items-center
                        text-gray-700
                        w-16 sm:w-auto
                    "
                >
                    {/* Circle */}
                    <div
                        className="
                            w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
                            rounded-full
                            flex items-center justify-center
                            bg-white border border-gray-300
                            shadow-sm
                            hover:shadow-md hover:scale-105
                            transition-all duration-200
                        "
                    >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                    </div>

                    {/* Label */}
                    <span
                        className="
                            text-[10px] sm:text-xs md:text-sm
                            mt-1.5 font-medium text-center
                        "
                    >
                        {label}
                    </span>
                </button>
            ))}
        </div>
    );
}
