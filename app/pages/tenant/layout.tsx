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
  LogOut,
  AlertCircle,
  MapPin,
  User,
} from "lucide-react";
import { MdOutlineRssFeed } from "react-icons/md";
import { RiCommunityFill } from "react-icons/ri";
import { FaFile } from "react-icons/fa";
import {
  ClockIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import Image from "next/image";
import LoadingScreen from "@/components/loadingScreen";

export default function TenantLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchSession, signOut } = useAuthStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
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
    },
    {
      name: "Chats",
      href: "/pages/tenant/chat",
      path: "/pages/tenant/chat",
      icon: ChatBubbleLeftRightIcon,
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
      name: "My Applications",
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
      name: "Visit History",
      href: "/pages/tenant/visit-history",
      path: "/pages/tenant/visit-history",
      icon: MapPin,
      badge: null,
    },
  ];

  const isActive = (path) => pathname === path;

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
  /*                            SIDEBAR CONTENT                                 */
  /* -------------------------------------------------------------------------- */

  const SidebarContent = () => (
    <>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          Upkyp
        </h1>
        <p className="text-xs text-gray-500 mt-1">Tenant Dashboard</p>
      </div>

      {/* User Profile Card */}
      {user && (
        <div className="p-4 border-b border-gray-200">
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="relative w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden">
                <Image
                  src={
                    user.profilePicture ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                  }
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  alt="profile"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-900 line-clamp-1 leading-tight">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email}
                </h2>
                <p className="text-xs text-gray-600 mt-1">Tenant Account</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navItems.map(({ href, name, icon: Icon, badge, path }) => {
            const active = isActive(path);

            return (
              <li key={href}>
                <button
                  onClick={() => {
                    router.push(href);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    flex items-center w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                    ${
                      active
                        ? "bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 mr-3 ${
                      active ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  <span className="flex-1 text-left">{name}</span>

                  {badge && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2 font-semibold">
                      {badge}
                    </span>
                  )}

                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section - Settings & Logout */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link
          href="/pages/commons/profile"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Settings className="w-5 h-5 mr-3 text-gray-400" />
          <span className="flex-1 text-left">Account Settings</span>
        </Link>

        <button
          onClick={() => {
            setMobileMenuOpen(false);
            setShowLogoutConfirm(true);
          }}
          className="flex items-center w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 group"
        >
          <LogOut className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-600" />
          <span className="flex-1 text-left">Logout</span>
        </button>
      </div>
    </>
  );

  /* -------------------------------------------------------------------------- */
  /*                                 RENDER                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow"
        aria-label="Open menu"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="fixed left-0 top-0 w-72 bg-white h-full shadow-xl flex flex-col pt-14"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button - Top Right Corner */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>

            <SidebarContent />
          </aside>
        </div>
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

      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30">
        <aside className="hidden lg:flex lg:flex-col fixed left-0 top-14 w-72 bg-white border-r border-gray-200 h-[calc(100vh-3.5rem)] z-20">
          <SidebarContent />
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 lg:pl-72 pt-14 lg:pt-0 bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20">
          {children}
        </main>
      </div>
    </>
  );
}
