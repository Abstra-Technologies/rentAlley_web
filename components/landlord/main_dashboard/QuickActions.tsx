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
      gradient: "from-blue-500 to-blue-600",
    },
    {
      id: "inviteTenant",
      label: "Invite Tenant",
      icon: UserPlus,
      onClick: onInviteTenant,
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      id: "announcement",
      label: "Announcement",
      icon: Megaphone,
      onClick: onAnnouncement,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      id: "workOrder",
      label: "Work Order",
      icon: List,
      onClick: onWorkOrder,
      gradient: "from-orange-500 to-orange-600",
    },
    {
      id: "income",
      label: "Income",
      icon: Wallet,
      onClick: onIncome,
      gradient: "from-blue-600 to-emerald-600",
    },
  ];

  return (
    <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 md:gap-4">
      {actions.map(({ id, label, icon: Icon, onClick, gradient }) => (
        <button
          key={id}
          onClick={onClick}
          className="group flex flex-col items-center w-16 md:w-20"
        >
          {/* Icon Circle */}
          <div
            className={`
                            w-12 h-12 md:w-14 md:h-14
                            rounded-full
                            flex items-center justify-center
                            bg-white border border-gray-200
                            shadow-sm
                            transition-all duration-200
                            group-hover:shadow-lg group-hover:scale-110 group-hover:border-transparent
                            group-hover:bg-gradient-to-br group-hover:${gradient}
                        `}
          >
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-white transition-colors" />
          </div>

          {/* Label */}
          <span className="mt-1.5 text-[10px] md:text-xs font-medium text-gray-700 text-center leading-tight">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
