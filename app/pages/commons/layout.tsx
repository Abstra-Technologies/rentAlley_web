"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import {
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { BellRing } from "lucide-react";

import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Home,
  ArrowLeft,
} from "lucide-react";

import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";

/* ---------------------------------------------
   CENTRALIZED NAVIGATION LIST
--------------------------------------------- */
const profileNavLinks = [
  {
    href: "/pages/commons/profile",
    label: "Profile",
    shortLabel: "Profile",
    icon: UserIcon,
    roles: ["tenant", "landlord", "admin"],
  },
  {
    href: "/pages/commons/profile/security",
    label: "Security & Privacy",
    shortLabel: "Security",
    icon: ShieldCheckIcon,
    roles: ["tenant", "landlord", "admin"],
  },
  {
    href: "/pages/commons/settings",
    label: "Notification",
    shortLabel: "Notification",
    icon: BellRing,
    roles: ["landlord", "tenant", "admin"],
  },
  {
    href: "/pages/commons/landlord/payoutDetails",
    label: "Payout Account",
    shortLabel: "Payout",
    icon: CreditCardIcon,
    roles: ["landlord"],
  },
  {
    href: "/pages/commons/landlord/subscription",
    label: "View Subscription",
    shortLabel: "Subscription",
    icon: CreditCardIcon,
    roles: ["landlord"],
  },
];

export default function SideNavProfile({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut, signOutAdmin, fetchSession } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    if (!isAuthChecking && !user) {
      router.replace("/pages/auth/login");
    }
  }, [user, isAuthChecking, router]);

  /* ---------------------------------------------
       CLOSE SIDEBAR ON ROUTE CHANGE
  --------------------------------------------- */
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  /* ---------------------------------------------
       PREVENT BODY SCROLL WHEN SIDEBAR OPEN
  --------------------------------------------- */
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const handleLogout = () => {
    if (!user) return;
    user?.userType ? signOut() : signOutAdmin();
    router.push("/pages/auth/login");
  };

  const mainPageUrl =
    user?.userType === "landlord"
      ? "/pages/landlord/dashboard"
      : "/pages/tenant/feeds";

  const mainPageLabel =
    user?.userType === "landlord" ? "Back to Dashboard" : "Back to Feeds";

  /* ---------------------------------------------
         FILTER NAV LINKS BASED ON ROLE
    --------------------------------------------- */
  const filteredLinks = profileNavLinks.filter((link) =>
    link.roles.includes(user?.userType || "guest")
  );

  // Show loading screen during auth check
  if (isAuthChecking) {
    return <LoadingScreen message="Loading your profile..." />;
  }

  // Show loading screen if user is not authenticated
  if (!user) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  // =====================================================
  // TENANT VIEW - Inline tabs + Mobile slide-out menu
  // =====================================================
  if (user?.userType === "tenant") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
        {/* Sticky Tab Navigation - top-0 on mobile (no navbar), top-16 on desktop */}
        <div className="sticky top-0 md:top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
          <div className="px-4">
            {/* Header Row */}
            <div className="flex items-center gap-3 py-3">
              <button
                onClick={() => router.push(mainPageUrl)}
                className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900">
                  Account Settings
                </h1>
              </div>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Tab Pills - Hidden on mobile, shown on md+ */}
            <div className="hidden md:flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
              {filteredLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap
                      font-medium text-sm transition-all duration-200
                      ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md shadow-blue-500/25"
                          : "text-gray-600 hover:bg-gray-100 bg-gray-50"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* MOBILE SIDEBAR OVERLAY - Tenant */}
        <div
          className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
            isSidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
              isSidebarOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar Panel */}
          <aside
            className={`absolute right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
              isSidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
              <h2 className="font-bold text-lg">Account Settings</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Section */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center gap-3">
                <Image
                  src={
                    user.profilePicture ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                  }
                  alt="Profile"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {user.firstName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email}
                  </p>
                  <p className="text-xs text-gray-500">Tenant Account</p>
                </div>
              </div>
            </div>

            {/* Back to Main Button */}
            <div className="p-4 border-b">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  router.push(mainPageUrl);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Home className="w-5 h-5" />
                {mainPageLabel}
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {filteredLinks.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 font-medium text-sm">
                      {item.label}
                    </span>
                    <ChevronRight
                      className={`w-5 h-5 ${
                        isActive ? "text-white/70" : "text-gray-400"
                      }`}
                    />
                  </Link>
                );
              })}

              {/* Logout */}
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors mt-4"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span className="flex-1 font-medium text-sm text-left">
                  Logout
                </span>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </button>
            </nav>
          </aside>
        </div>

        {/* Main Content - Full width */}
        <main>{children}</main>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              style={{ animation: "modalPop 0.3s ease-out" }}
            >
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to sign out?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Animation Keyframes */}
        <style jsx global>{`
          @keyframes modalPop {
            0% {
              opacity: 0;
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    );
  }

  // =====================================================
  // LANDLORD VIEW - Full Sidebar Layout
  // =====================================================
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      {/*---------------------------------------------*/}
      {/* DESKTOP SIDEBAR */}
      {/*---------------------------------------------*/}
      <aside className="hidden md:flex md:flex-col md:fixed md:top-0 md:bottom-0 md:z-40 md:w-72 md:bg-white md:shadow-xl">
        <div className="flex flex-col h-full">
          {/* HEADER */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm">
            <Link
              href="/pages/landlord/dashboard"
              className="text-2xl font-bold text-white"
            >
              Upkyp
            </Link>
            <p className="text-xs text-white/80 mt-1">Account Settings</p>
          </div>

          {/* Back Button */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => router.push(mainPageUrl)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-xl hover:from-blue-100 hover:to-emerald-100 transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-blue-600" />
              {mainPageLabel}
            </button>
          </div>

          {/* PROFILE HEADER */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
              <Image
                src={
                  user.profilePicture ||
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                }
                alt="Profile"
                width={44}
                height={44}
                className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.firstName
                    ? `${user.firstName} ${user.lastName}`
                    : user.companyName || user.email}
                </p>
                <p className="text-xs text-gray-600">Landlord Account</p>
              </div>
            </div>
          </div>

          {/* NAVIGATION LIST */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {filteredLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                );
              })}

              {/* LOGOUT */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 w-full mt-2 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </nav>

          {/* Help Section */}
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium mb-1">Need Help?</div>
              <div className="text-xs opacity-90 mb-3">Contact support</div>
              <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                Get Support
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} Upkyp
              </p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/*---------------------------------------------*/}
      {/* MOBILE HEADER - Landlord Profile */}
      {/*---------------------------------------------*/}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-between px-4 z-50">
        <button
          onClick={() => router.push(mainPageUrl)}
          className="flex items-center gap-2 text-white"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-semibold">Settings</span>
        </button>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </div>

      {/*---------------------------------------------*/}
      {/* MOBILE SIDEBAR - Landlord (Slide from right) */}
      {/*---------------------------------------------*/}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar Panel */}
        <aside
          className={`absolute right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="p-4 flex justify-between items-center bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
            <h2 className="font-bold text-lg">Account Settings</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Section */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-3">
              <Image
                src={
                  user.profilePicture ||
                  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                }
                alt="Profile"
                width={48}
                height={48}
                className="w-12 h-12 rounded-xl border-2 border-white shadow-md object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {user.firstName
                    ? `${user.firstName} ${user.lastName}`
                    : user.companyName || user.email}
                </p>
                <p className="text-xs text-gray-600">Landlord Account</p>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="p-4 border-b">
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                router.push(mainPageUrl);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Home className="w-5 h-5" />
              {mainPageLabel}
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 font-medium text-sm">
                    {item.label}
                  </span>
                  <ChevronRight
                    className={`w-5 h-5 ${
                      isActive ? "text-white/70" : "text-gray-400"
                    }`}
                  />
                </Link>
              );
            })}

            {/* Logout */}
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors mt-4"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="flex-1 font-medium text-sm text-left">
                Logout
              </span>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </button>
          </nav>

          {/* Help */}
          <div className="p-4 border-t">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium mb-1">Need Help?</div>
              <div className="text-xs opacity-90 mb-3">Contact support</div>
              <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                Get Support
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/*---------------------------------------------*/}
      {/* LOGOUT MODAL */}
      {/*---------------------------------------------*/}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            style={{ animation: "modalPop 0.3s ease-out" }}
          >
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
              Confirm Logout
            </h3>
            <p className="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to sign out?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/*---------------------------------------------*/}
      {/* MAIN CONTENT - With sidebar offset for landlord */}
      {/*---------------------------------------------*/}
      <main className="flex-1 md:pl-72 pt-14 md:pt-0">{children}</main>

      {/* Animation Keyframes */}
      <style jsx global>{`
        @keyframes modalPop {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
