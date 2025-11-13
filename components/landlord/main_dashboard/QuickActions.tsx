"use client";

import { Home, UserPlus, Megaphone } from "lucide-react";

export default function QuickActions({
  onAddProperty,
  onInviteTenant,
  onAnnouncement,
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
  ];

  return (
    <div className="w-full flex items-center justify-center gap-10 py-4">
      {actions.map(({ id, label, icon: Icon, onClick }) => (
        <button
          key={id}
          onClick={onClick}
          className="flex flex-col items-center text-gray-700"
        >
          {/* Circle */}
          <div
            className="
              w-16 h-16 sm:w-18 sm:h-18
              rounded-full flex items-center justify-center
              bg-white
              border border-gray-300 
              shadow-sm
              hover:shadow-md 
              hover:scale-105
              transition-all duration-200
            "
          >
            <Icon className="w-6 h-6 text-gray-700" />
          </div>

          {/* Label */}
          <span className="text-sm mt-2 font-medium">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
