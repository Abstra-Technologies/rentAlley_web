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
  Settings,
  ChevronLeft,
  Inbox,
  AlertCircle,
} from "lucide-react";
import SendTenantInviteModal from "@/components/landlord/properties/sendInvite";
import NotificationSection from "@/components/notification/notifCenter";
import Image from "next/image";
import LoadingScreen from "@/components/loadingScreen";

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchSession, signOut } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (!user) {
        await fetchSession();
      }
      setIsAuthChecking(false);
    }

    checkAuth();
  }, [user, fetchSession]);

  useEffect(() => {
    if (!isAuthChecking && user && user.userType !== "landlord") {
      router.replace("/pages/auth/login");
    }
  }, [user, isAuthChecking, router]);

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsMobileProfileOpen(false);
  }, [pathname]);

  const isInsideProperty =
    pathname.includes("/pages/landlord/properties/") &&
    !pathname.includes("/pages/commons/profile");

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
      label: "Work Orders",
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
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  // Show loading screen during auth check
  if (isAuthChecking) {
    return <LoadingScreen message="Verifying your session..." />;
  }

  // Show loading screen if user is not authenticated or wrong user type
  if (!user || user.userType !== "landlord") {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  if (isInsideProperty) {
    return <main className="flex-1 min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      {/* Desktop Sidebar with enhanced shadow */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 lg:w-72 lg:bg-white lg:shadow-xl">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Sidebar Header with Logo and Notifications */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm">
            <div className="flex items-center justify-between">
              <Link
                href="/pages/landlord/dashboard"
                className="flex items-center"
              >
                <h1 className="text-2xl font-bold text-white">UpKyp</h1>
              </Link>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <NotificationSection user={user} admin={null} />
                  <style jsx global>{`
                    .notification-dropdown {
                      position: absolute !important;
                      right: 0 !important;
                      left: auto !important;
                      top: 100% !important;
                      margin-top: 0.5rem !important;
                    }
                  `}</style>
                </div>
              </div>
            </div>
            <p className="text-xs text-white/80 mt-1">Landlord Portal</p>
          </div>

          {/* User Profile Section with Settings Icon */}
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
                      relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                      font-medium transition-all duration-200 group
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

          {/* Logout Button at Bottom of Desktop Sidebar */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg z-50 h-14">
        <div className="flex justify-between items-center h-full px-4">
          <Link href="/pages/landlord/dashboard" className="flex items-center">
            <h1 className="text-xl font-bold text-white">UpKyp</h1>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative">
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
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Mobile Sidebar */}
          <aside className="lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col">
            {/* Mobile Sidebar Header */}
            <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-between shadow-sm">
              <h2 className="text-lg font-bold text-white">Menu</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Mobile Profile Section */}
            {!isMobileProfileOpen && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => setIsMobileProfileOpen(true)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200"
                >
                  <Image
                    src={
                      user.profilePicture ||
                      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                    }
                    alt="Profile"
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.companyName || user.email}
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
                        user.profilePicture ||
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                      }
                      alt="Profile"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.companyName || "User"}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
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
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            ) : (
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

                  {user?.landlord_id && (
                    <div className="mt-6 px-1">
                      <SendTenantInviteModal landlord_id={user.landlord_id} />
                    </div>
                  )}
                </nav>

                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setShowLogoutConfirm(true);
                    }}
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Confirm Logout
              </h3>

              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to logout? You'll need to sign in again to
                access your account.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pl-72 pt-14 lg:pt-0 bg-gradient-to-br from-gray-50 via-blue-50/20 to-emerald-50/20">
        {children}
      </main>
    </div>
  );
}
