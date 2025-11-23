"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import axios from "axios";
import { useState, useEffect } from "react";
import useAuthStore from "@/zustand/authStore";
import Image from "next/image";
import NotificationSection from "@/components/notification/notifCenter";
import {
  Home,
  Building2,
  FileText,
  CreditCard,
  BarChart3,
  ArrowLeft,
  SlidersHorizontal,
  Zap,
  Videotape,
  ScrollText,
  Menu,
  X,
  ChevronLeft,
  MapPin,
  Settings,
  LogOut,
  Users,
    CopyMinus,
    HandCoins
} from "lucide-react";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  const { data, error, isLoading } = useSWR(
    id ? `/api/propertyListing/getPropDetailsById?property_id=${id}` : null,
    fetcher
  );

  const property = data?.property;
  const propertyName = property?.property_name || "Loading...";
  const city = property?.city || "";
  const province = property?.province || "";

  const menu = [
      {
          id: "edit",
          label: "Edit Property Details",
          href: `/pages/landlord/properties/${id}/editPropertyDetails?${id}`,
          icon: CopyMinus ,
      },
    {
      id: "units",
      label: "Units",
      href: `/pages/landlord/properties/${id}`,
      icon: Home,
    },
    {
      id: "active-lease",
      label: "Active Lease",
      href: `/pages/landlord/properties/${id}/activeLease`,
      icon: ScrollText,
    },
    {
      id: "billing",
      label: "Billing",
      href: `/pages/landlord/properties/${id}/billing`,
      icon: CreditCard,
    },
    {
      id: "pdc-management",
      label: "PDC Management",
      href: `/pages/landlord/properties/${id}/pdcManagement`,
      icon: FileText,
    },
    {
      id: "Assets",
      label: "Assets",
      href: `/pages/landlord/properties/${id}/assets_management`,
      icon: Videotape,
    },
    {
      id: "Prospectives",
      label: "Prospectives",
      href: `/pages/landlord/properties/${id}/prospectives`,
      icon: Users,
    },
    {
      id: "documents",
      label: "Documents",
      href: `/pages/landlord/properties/${id}/documents`,
      icon: FileText,
    },
      {
          id: "finance",
          label: "Financials",
          href: `/pages/landlord/properties/${id}/financials`,
          icon: HandCoins,
      },
    {
      id: "Reports",
      label: "Reports",
      href: `/pages/landlord/properties/${id}/reports`,
      icon: BarChart3,
    },
    {
      id: "utilities",
      label: "Utilities",
      href: `/pages/landlord/properties/${id}/utilities`,
      icon: Zap,
    },
    {
      id: "configuration",
      label: "Configuration",
      href: `/pages/landlord/properties/${id}/configurations`,
      icon: SlidersHorizontal,
    },
  ];

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsMobileProfileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut();
    router.push("/pages/auth/login");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      {/* Desktop/Tablet Sidebar with enhanced shadow */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 lg:w-72 lg:bg-white lg:shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm">
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() =>
                    router.push("/pages/landlord/property-listing")
                  }
                  className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Properties
                </button>

                <div className="flex items-center gap-2">
                  {/* Notification with CSS override for right positioning */}
                  <div className="relative notification-wrapper">
                    <NotificationSection user={user} admin={null} />
                  </div>
                </div>
              </div>

              {/* Property Info Card */}
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-white truncate">
                      {isLoading ? (
                        <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
                      ) : (
                        propertyName
                      )}
                    </h1>
                    {city && province ? (
                      <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {city}, {province}
                      </p>
                    ) : isLoading ? (
                      <div className="h-4 w-24 bg-white/20 rounded animate-pulse mt-1" />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Profile Section with Settings Icon */}
          {user && (
            <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3 p-2">
                <Image
                  src={
                    user.profilePicture ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                  }
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.companyName || user.email}
                  </p>
                  <p className="text-xs text-gray-500">Landlord Account</p>
                </div>
                <Link
                  href="/pages/commons/profile"
                  className="p-2 hover:bg-white rounded-lg transition-all duration-200 hover:shadow-md group"
                >
                  <Settings className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                </Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
            <div className="space-y-1">
              {menu.map(({ id: menuId, label, href, icon: Icon }) => {
                const isActive =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={menuId}
                    href={href}
                    className={`
                      relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                      font-medium transition-all duration-200 group
                      ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100 hover:shadow-md"
                      }
                    `}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/40 rounded-r-full" />
                    )}
                    <Icon
                      className={`w-5 h-5 ${
                        !isActive && "group-hover:text-blue-600"
                      }`}
                    />
                    <span className="text-sm">{label}</span>
                    {isActive && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-white/80 animate-pulse"></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} UpKyp
              </p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg z-50 h-14">
        <div className="flex justify-between items-center h-full px-4">
          {/* Left side - Back button and Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/pages/landlord/property-listing")}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-white truncate">
                {isLoading ? "Loading..." : propertyName}
              </h1>
              {city && province && (
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {city}, {province}
                </p>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <div className="relative notification-wrapper">
              <NotificationSection user={user} admin={null} />
            </div>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Mobile Sidebar - matching main sidebar style */}
          <aside className="lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-[70] flex flex-col">
            {/* Mobile Sidebar Header */}
            <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-between shadow-sm">
              <h2 className="text-lg font-bold text-white">Property Menu</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Property Info in Mobile */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900 truncate">
                    {propertyName}
                  </h2>
                  {city && province && (
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {city}, {province}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Profile Section */}
            {user && !isMobileProfileOpen && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => setIsMobileProfileOpen(true)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  <Image
                    src={
                      user?.profilePicture ||
                      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                    }
                    alt="Profile"
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.companyName || user?.email}
                    </p>
                    <p className="text-xs text-gray-500">Landlord Account</p>
                  </div>
                  <Settings className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            )}

            {/* Mobile Profile Menu */}
            {isMobileProfileOpen ? (
              <div className="flex-1 overflow-y-auto">
                <button
                  onClick={() => setIsMobileProfileOpen(false)}
                  className="w-full px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Back to Menu
                  </span>
                </button>

                <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-emerald-50">
                  <div className="flex items-center gap-3">
                    <Image
                      src={
                        user?.profilePicture ||
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                      }
                      alt="Profile"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user?.companyName || "User"}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <Link
                    href="/pages/commons/profile"
                    onClick={() => setIsSidebarOpen(false)}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Account Settings
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Mobile Navigation Menu */
              <div className="flex-1 overflow-y-auto">
                <nav className="px-3 py-4">
                  <div className="space-y-1">
                    {menu.map(({ id: menuId, label, href, icon: Icon }) => {
                      const isActive =
                        pathname === href || pathname.startsWith(href + "/");
                      return (
                        <Link
                          key={menuId}
                          href={href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`
                            relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                            font-medium transition-all duration-200
                            ${
                              isActive
                                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg"
                                : "text-gray-700 hover:bg-gray-100 hover:shadow-md"
                            }
                          `}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/40 rounded-r-full" />
                          )}
                          <Icon className="w-5 h-5" />
                          <span className="text-sm">{label}</span>
                          {isActive && (
                            <div className="ml-auto h-2 w-2 rounded-full bg-white/80 animate-pulse"></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </nav>

                {/* Bottom Logout for quick access */}
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-lg hover:from-red-50 hover:to-red-100 hover:text-red-600 font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </aside>
        </>
      )}

      {/* Main Content with better spacing */}
      <main className="flex-1 lg:pl-72 pt-14 lg:pt-0 bg-gradient-to-br from-gray-50 via-blue-50/20 to-emerald-50/20">
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
