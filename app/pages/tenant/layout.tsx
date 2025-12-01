"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";

// Icons
import {
  Menu,
  X,
  Settings,
  ChevronLeft,
  LogOut,
  ChevronRight,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { MdOutlineRssFeed } from "react-icons/md";
import { RiCommunityFill } from "react-icons/ri";
import { FaFile } from "react-icons/fa";
import { ClockIcon } from "@heroicons/react/24/outline";

import Image from "next/image";
import LoadingScreen from "@/components/loadingScreen";

export default function TenantLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchSession, signOut } = useAuthStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [undecidedApplications, setUndecidedApplications] = useState(0);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // If inside rentalPortal → completely disable this outer layout
  const isInsideRentalPortal = pathname.includes("/pages/tenant/rentalPortal/");

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
    if (!isAuthChecking && user && user.userType !== "tenant") {
      router.replace("/pages/auth/login");
    }
  }, [user, isAuthChecking, router]);

  // Fetch pending applications count
  useEffect(() => {
    if (!user?.tenant_id) return;

    const loadPending = async () => {
      try {
        const res = await fetch(
          `/api/tenant/applications/pendingApplications?tenant_id=${user.tenant_id}`
        );
        const data = await res.json();
        setUndecidedApplications(data.count || 0);
      } catch (err) {
        console.error("Pending fetch failed:", err);
      }
    };

    loadPending();
  }, [user?.tenant_id]);

  useEffect(() => {
    setIsSidebarOpen(false);
    setIsMobileProfileOpen(false);
  }, [pathname]);

  /* -------------------------------------------------------------------------- */
  /*                               NAV ITEMS                                    */
  /* -------------------------------------------------------------------------- */

  const navItems = [
    {
      name: "Feeds",
      href: "/pages/tenant/feeds",
      path: "/pages/tenant/feeds",
      icon: MdOutlineRssFeed,
      badge: null,
      priority: 1,
    },
    {
      name: "Chats",
      href: "/pages/tenant/chat",
      path: "/pages/tenant/chat",
      icon: MessageCircle,
      badge: null,
      priority: 1,
    },
    {
      name: "My Units",
      href: "/pages/tenant/my-unit",
      path: "/pages/tenant/my-unit",
      icon: RiCommunityFill,
      badge: null,
      priority: 1,
    },
    {
      name: "My Applications",
      href: "/pages/tenant/myApplications",
      path: "/pages/tenant/myApplications",
      icon: FaFile,
      badge: undecidedApplications > 0 ? undecidedApplications : null,
      priority: 2,
    },
    {
      name: "Unit History",
      href: "/pages/tenant/unitHistory",
      path: "/pages/tenant/unitHistory",
      icon: ClockIcon,
      badge: null,
      priority: 2,
    },
  ];

  const isActive = (path) => pathname === path;

  const navigateWithLoader = (label, href) => {
    router.push(href);
  };

  const logoutNow = async () => {
    await signOut();
    router.push("/pages/auth/login");
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logoutNow();
  };

  // Show loading screen during auth check
  if (isAuthChecking) {
    return <LoadingScreen message="Verifying your session..." />;
  }

  // Show loading screen if user is not authenticated or wrong user type
  if (!user || user.userType !== "tenant") {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  if (isInsideRentalPortal) {
    return <main className="flex-1 min-h-screen">{children}</main>;
  }

  /* -------------------------------------------------------------------------- */
  /*                                 RENDER                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
      {/* ===================== DESKTOP SIDEBAR ===================== */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed top-14 bottom-0 lg:z-40 lg:w-72 bg-white shadow-xl">
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={idx} className="relative group">
                  <button
                    onClick={() => navigateWithLoader(item.name, item.href)}
                    className={`flex w-full items-center px-3 py-2.5 rounded-lg text-sm transition-all
                      ${
                        active
                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium shadow-sm"
                          : "hover:bg-gray-50 text-gray-700"
                      }
                    `}
                  >
                    {/* Active marker */}
                    <span
                      className={`absolute left-0 h-full w-0.5 rounded-r bg-gradient-to-b from-indigo-600 to-purple-600 
                        ${
                          active
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        } transition-opacity`}
                    />

                    <Icon
                      className={`w-4 h-4 mr-3 ${
                        active ? "text-indigo-700" : "text-gray-500"
                      }`}
                    />

                    <span className="flex-1 text-left">{item.name}</span>

                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2">
                        {item.badge}
                      </span>
                    )}

                    {active && (
                      <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Logout Button */}
          <div className="px-2 py-4 border-t border-gray-100 mt-4">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>

          {/* Help card */}
          <div className="mx-2 mt-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-3 text-white">
              <div className="text-xs font-medium mb-1">Need Help?</div>
              <div className="text-xs opacity-90 mb-2">Contact support</div>
              <button className="bg-white/20 text-white px-2 py-1 text-xs rounded hover:bg-white/30">
                Get Support
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* ===================== MOBILE SIDEBAR ===================== */}

      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside className="lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col">
            {/* Mobile Sidebar Header */}
            <div className="px-4 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-sm flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Menu</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* MOBILE PROFILE */}
            {!isMobileProfileOpen && (
              <div className="px-4 py-3 bg-gray-50/50 border-b">
                <button
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-md"
                  onClick={() => setIsMobileProfileOpen(true)}
                >
                  <Image
                    src={
                      user.profilePicture ||
                      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                    }
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                    alt="profile"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 text-sm">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </p>
                    <p className="text-xs text-gray-500">Tenant Account</p>
                  </div>
                  <Settings className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            )}

            {/* MOBILE PROFILE PANEL */}
            {isMobileProfileOpen ? (
              <div className="flex-1 overflow-y-auto">
                <button
                  onClick={() => setIsMobileProfileOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-3 border-b hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Back to Menu</span>
                </button>

                <div className="px-4 py-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex items-center gap-3">
                    <Image
                      src={
                        user?.profilePicture ||
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                      }
                      width={48}
                      height={48}
                      alt="profile"
                      className="rounded-full border-2 border-white shadow-md object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/pages/commons/profile"
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  <Settings className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-700 font-medium">
                    Account Settings
                  </span>
                </Link>

                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            ) : (
              /* MOBILE NAVIGATION */
              <div className="flex-1 overflow-y-auto">
                <nav className="px-3 py-4 space-y-2">
                  {navItems.map((item, idx) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <button
                        key={idx}
                        onClick={() => navigateWithLoader(item.name, item.href)}
                        className={`flex items-center w-full px-3 py-2.5 rounded-lg transition
                          ${
                            active
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                              : "text-gray-700 hover:bg-gray-100"
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm ml-2 flex-1">{item.name}</span>

                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                            {item.badge}
                          </span>
                        )}

                        {active && (
                          <div className="h-2 w-2 bg-white/80 rounded-full ml-auto animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </aside>
        </>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Confirm Logout
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to sign out? You'll need to log in again to
              access your account.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MAIN CONTENT ===================== */}
      <main className="flex-1 lg:pl-72 pt-14 lg:pt-0 bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20">
        {children}
      </main>
    </div>
  );
}
