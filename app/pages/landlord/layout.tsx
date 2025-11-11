"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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
  ChevronDown,
  User,
  Star,
  ChevronLeft,
  Inbox,
} from "lucide-react";
import SendTenantInviteModal from "@/components/landlord/properties/sendInvite";
import NotificationSection from "@/components/notification/notifCenter";
import Image from "next/image";

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchSession, signOut } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) fetchSession();
    else if (user.userType !== "landlord") {
      router.replace("/pages/auth/login");
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsMobileProfileOpen(false);
  }, [pathname]);

  const isInsideProperty = pathname.includes("/pages/landlord/properties/");

  const navLinks = [
    { label: "Dashboard", href: "/pages/landlord/dashboard", icon: Home },
    { label: "Inbox", href: "/pages/landlord/inbox", icon: Inbox },
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
      label: "Maintenance",
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

  const handleLogout = async () => {
    await signOut();
    router.push("/pages/auth/login");
    setIsProfileDropdownOpen(false);
  };

  if (isInsideProperty) {
    // Return the property-specific sidebar layout
    return <main className="flex-1 min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 lg:w-72 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Sidebar Header with Logo and Notifications */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-emerald-600">
            <div className="flex items-center justify-between">
              <Link
                href="/pages/landlord/dashboard"
                className="flex items-center"
              >
                <h1 className="text-2xl font-bold text-white">UpKyp</h1>
              </Link>
              <div className="flex items-center gap-2">
                <NotificationSection user={user} admin={null} />
              </div>
            </div>
            <p className="text-xs text-white/80 mt-1">Landlord Portal</p>
          </div>

          {/* User Profile Section with Dropdown */}
          {user && (
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
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
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.companyName || user.email}
                    </p>
                    <p className="text-xs text-gray-500">Landlord Account</p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                    {/* User Email */}
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
                      <div className="text-xs text-gray-500">Signed in as</div>
                      <div className="text-sm font-medium text-gray-900 truncate mt-1">
                        {user.email}
                      </div>
                    </div>

                    {/* Points Section */}
                    {user?.points !== undefined && (
                      <div className="px-4 py-3 bg-amber-50 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Reward Points
                            </span>
                          </div>
                          <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                            {user.points}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/pages/commons/profile"
                        className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <User className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
                          View Profile
                        </span>
                      </Link>

                      <Link
                        href="/pages/commons/profile"
                        className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
                          Account Settings
                        </span>
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
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
                    {isActive && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-white/80"></div>
                    )}
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
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg z-50 h-14">
        <div className="flex justify-between items-center h-full px-4">
          {/* Logo */}
          <Link href="/pages/landlord/dashboard" className="flex items-center">
            <h1 className="text-xl font-bold text-white">UpKyp</h1>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <NotificationSection user={user} admin={null} />
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
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Mobile Sidebar */}
          <aside className="lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col">
            {/* Mobile Sidebar Header */}
            <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Menu</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Mobile Profile Section */}
            {user && !isMobileProfileOpen && (
              <div className="px-4 py-3 border-b border-gray-100">
                <button
                  onClick={() => setIsMobileProfileOpen(true)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Image
                    src={
                      user.profilePicture ||
                      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                    }
                    alt="Profile"
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.companyName || user.email}
                    </p>
                    <p className="text-xs text-gray-500">Landlord Account</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            {/* Mobile Profile Menu */}
            {isMobileProfileOpen ? (
              <div className="flex-1 overflow-y-auto">
                {/* Back Button */}
                <button
                  onClick={() => setIsMobileProfileOpen(false)}
                  className="w-full px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Back to Menu
                  </span>
                </button>

                {/* Profile Info */}
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
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
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

                {/* Points */}
                {user?.points !== undefined && (
                  <div className="px-4 py-3 bg-amber-50 border-y border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Reward Points
                        </span>
                      </div>
                      <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        {user.points}
                      </span>
                    </div>
                  </div>
                )}

                {/* Profile Actions */}
                <div className="py-2">
                  <Link
                    href="/pages/commons/profile"
                    onClick={() => setIsSidebarOpen(false)}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      View Profile
                    </span>
                  </Link>

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
                    {navLinks.map(({ label, href, icon: Icon }) => {
                      const isActive =
                        pathname === href || pathname.startsWith(href + "/");
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg
                            font-medium transition-all duration-200
                            ${
                              isActive
                                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                                : "text-gray-700 hover:bg-gray-100"
                            }
                          `}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm">{label}</span>
                          {isActive && (
                            <div className="ml-auto h-2 w-2 rounded-full bg-white/80"></div>
                          )}
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

                {/* Bottom Logout for quick access */}
                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 font-medium transition-all duration-200"
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

      {/* Main Content */}
      <main className="flex-1 lg:pl-72 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
