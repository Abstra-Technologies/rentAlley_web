"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import {
  Home,
  Building,
  Wallet,
  Banknote,
  ChartArea,
  LogOut,
  MessageSquareMore,
  Calendar,
  Construction,
  Megaphone,
  Menu,
  X,
  Users,

  Bell,
  Settings,
} from "lucide-react";
import SendTenantInviteModal from "@/components/landlord/properties/sendInvite";
import Image from "next/image";

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchSession, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) fetchSession();
    else if (user.userType !== "landlord") {
      router.replace("/pages/auth/login");
    }
  }, [user]);

  const isInsideProperty = pathname.includes("/pages/landlord/properties/");

  const navLinks = [
    { label: "Dashboard", href: "/pages/landlord/dashboard", icon: Home },
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
    { label: "Payments", href: "/pages/landlord/payments", icon: Wallet },
    {
      label: "Maintenance Requests",
      href: "/pages/landlord/maintenance-request",
      icon: Construction,
    },
    {
      label: "Tax Compliance",
      href: "/pages/landlord/taxManagement",
      icon: Banknote,
    },
    {
      label: "Analytics",
      href: "/pages/landlord/analytics/performance",
      icon: ChartArea,
    },
  ];

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (isInsideProperty) {
    return <main className="flex-1 min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 lg:w-72 lg:bg-white lg:border-r lg:border-gray-200 lg:pt-16">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Sidebar Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Landlord Portal
            </h1>
          </div>

          {/* User Profile Section - Only show if user data is available */}
          {user && (
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src={
                      user.profilePicture ||
                      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                    }
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Landlord Account</p>
                </div>
                <Link
                  href="/pages/commons/profile"
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                </Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {navLinks.map(({ label, href, icon: Icon }) => {
                const isActive =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      font-medium transition-all duration-200 group
                      ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        !isActive && "group-hover:text-blue-600"
                      }`}
                    />
                    <span className="text-sm">{label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Tenant Invite Button */}
            {user?.landlord_id && (
              <div className="mt-6 px-1">
                <SendTenantInviteModal landlord_id={user.landlord_id} />
              </div>
            )}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => {
                logout();
                router.push("/pages/auth/login");
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 font-medium transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-72">{children}</main>
    </div>
  );
}
