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
        { id: "addProperty", label: "Add Property", icon: Home, onClick: onAddProperty },
        { id: "inviteTenant", label: "Invite Tenant", icon: UserPlus, onClick: onInviteTenant },
        { id: "announcement", label: "Announcement", icon: Megaphone, onClick: onAnnouncement },
        { id: "workOrder", label: "Work Order", icon: List, onClick: onWorkOrder },
        { id: "income", label: "Income", icon: Wallet, onClick: onIncome },
    ];

    return (
        <div
            className="
                w-full flex flex-wrap justify-center items-center
                gap-3 sm:gap-4
                py-2
            "
        >
            {actions.map(({ id, label, icon: Icon, onClick }) => (
                <button
                    key={id}
                    onClick={onClick}
                    className="
                        flex flex-col items-center
                        text-gray-700
                        w-14 sm:w-16
                    "
                >
                    {/* Icon Circle */}
                    <div
                        className="
                            w-10 h-10 sm:w-12 sm:h-12
                            rounded-full
                            flex items-center justify-center
                            bg-white border border-gray-300
                            shadow-sm
                            hover:shadow-md hover:scale-105
                            transition-all duration-200
                        "
                    >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                    </div>

                    {/* Label */}
                    <span
                        className="
                            mt-1 text-[9px] sm:text-[10px] md:text-xs
                            font-medium text-center leading-tight
                        "
                    >
                        {label}
                    </span>
                </button>
            ))}
        </div>
    );
}
