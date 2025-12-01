"use client";

import TenantPayables from "@/components/tenant/analytics-insights/consolidated-analytics/totalPayables";
import AnnouncementFeeds from "@/components/tenant/feeds/announcement";
import TenantMaintenanceWidget from "@/components/tenant/feeds/TenantMaintenanceWidget";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useRouter, usePathname } from "next/navigation";
import { MdOutlineRssFeed } from "react-icons/md";
import { RiCommunityFill } from "react-icons/ri";
import { FaFile } from "react-icons/fa";
import { MessageCircle, MapPin } from "lucide-react";

export default function MobileFeedsPage({ user, undecidedApplications = 0 }) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      name: "Feeds",
      href: "/pages/tenant/feeds",
      path: "/pages/tenant/feeds",
      icon: MdOutlineRssFeed,
      badge: null,
    },
    {
      name: "Chats",
      href: "/pages/tenant/chat",
      path: "/pages/tenant/chat",
      icon: MessageCircle,
      badge: null,
    },
    {
      name: "My Units",
      href: "/pages/tenant/my-unit",
      path: "/pages/tenant/my-unit",
      icon: RiCommunityFill,
      badge: null,
    },
    {
      name: "Applications",
      href: "/pages/tenant/myApplications",
      path: "/pages/tenant/myApplications",
      icon: FaFile,
      badge: undecidedApplications > 0 ? undecidedApplications : null,
    },
    {
      name: "Unit History",
      href: "/pages/tenant/unitHistory",
      path: "/pages/tenant/unitHistory",
      icon: ClockIcon,
      badge: null,
    },
    {
      name: "Visits",
      href: "/pages/tenant/visit-history",
      path: "/pages/tenant/visit-history",
      icon: MapPin,
      badge: null,
    },
  ];

  const isActive = (path) => pathname === path;

  return (
    <div className="block lg:hidden w-full px-4 py-4">
      <div className="w-full max-w-[480px] mx-auto space-y-4">
        {/* PAYABLES */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <TenantPayables tenant_id={user?.tenant_id} />
        </div>

        {/* NAVIGATION */}
        <div className="grid grid-cols-6 gap-1.5">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={idx}
                onClick={() => router.push(item.href)}
                className={`relative flex flex-col items-center justify-center py-2.5 rounded-xl shadow-sm active:scale-95 transition-all aspect-square ${
                  active
                    ? "bg-gradient-to-br from-blue-500 to-emerald-500 border-transparent"
                    : "bg-white border border-gray-200 hover:border-blue-300"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${
                    active
                      ? "bg-white/20"
                      : "bg-gradient-to-br from-blue-50 to-emerald-50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-white" : "text-blue-600"
                    }`}
                  />
                </div>
                <span
                  className={`text-[9px] font-semibold leading-tight text-center ${
                    active ? "text-white" : "text-gray-700"
                  }`}
                >
                  {item.name}
                </span>

                {/* Badge */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ANNOUNCEMENTS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
              <MegaphoneIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Announcements
              </h2>
              <p className="text-xs text-gray-600">Latest updates</p>
            </div>
          </div>

          <AnnouncementFeeds
            tenant_id={user?.tenant_id}
            maxItems={3}
            showViewAll={true}
          />
        </div>

        {/* MAINTENANCE */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <TenantMaintenanceWidget tenant_id={user?.tenant_id} maxItems={3} />
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
}
