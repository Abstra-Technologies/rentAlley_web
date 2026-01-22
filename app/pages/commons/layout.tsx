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
  // {
  //     href: "/pages/commons/settings",
  //     label: "Notification",
  //     shortLabel: "Notification",
  //     icon: BellRing,
  //     roles: ["landlord", "tenant", "admin"],
  // },
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
    link.roles.includes(user?.userType || "guest"),
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
  // TENANT VIEW - Simple inline tabs (Navbar handles main nav)
  // =====================================================
  if (user?.userType === "tenant") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
        {/* Sticky Tab Navigation */}
        <div className="sticky top-14 md:top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4">
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
            </div>

            {/* Tab Pills */}
            <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
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
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{item.shortLabel}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content - Full width, no sidebar offset */}
        <main className="max-w-4xl mx-auto">{children}</main>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
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

          {/* PROFILE HEADER - UPDATED */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
              <div className="relative w-11 h-11 flex-shrink-0">
                <Image
                  src={
                    user.profilePicture ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                  }
                  alt="Profile"
                  width={44}
                  height={44}
                  className="w-full h-full rounded-xl object-cover border-2 border-white shadow-sm"
                />
              </div>
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
      {/* MOBILE MENU BUTTON - Bottom LEFT to avoid FeedbackWidget */}
      {/*---------------------------------------------*/}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-6 left-6 z-50 p-4 rounded-2xl shadow-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-xl hover:scale-105 transition-all"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/*---------------------------------------------*/}
      {/* MOBILE SIDEBAR - Bottom Sheet */}
      {/*---------------------------------------------*/}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
              <h2 className="text-lg font-bold">Account Settings</h2>
              <p className="text-sm text-white/80">Manage your profile</p>
            </div>

            {/* Back Button */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  router.push(mainPageUrl);
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Home className="w-5 h-5" />
                {mainPageLabel}
              </button>
            </div>

            {/* Mobile Profile - UPDATED */}
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image
                    src={
                      user.profilePicture ||
                      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                    }
                    alt="Profile"
                    width={48}
                    height={48}
                    className="w-full h-full rounded-xl border-2 border-white shadow-md object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {user.firstName
                      ? `${user.firstName} ${user.lastName}`
                      : user.companyName || user.email}
                  </p>
                  <p className="text-xs text-gray-600">Landlord Account</p>
                </div>
              </div>
            </div>

            {/* Mobile Nav */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-200 border-2 ${
                      isActive
                        ? "bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-200 text-blue-700"
                        : "bg-white border-gray-100 hover:border-gray-200 text-gray-700"
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl ${
                        isActive
                          ? "bg-gradient-to-r from-blue-100 to-emerald-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? "text-blue-700" : "text-gray-500"
                        }`}
                      />
                    </div>
                    <span className="flex-1 font-medium text-sm">
                      {item.label}
                    </span>
                    <ChevronRight
                      className={`w-5 h-5 ${
                        isActive ? "text-blue-700" : "text-gray-400"
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
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors mt-2"
              >
                <div className="p-2.5 rounded-xl bg-red-100">
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </div>
                <span className="flex-1 font-medium text-sm text-left">
                  Logout
                </span>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </button>

              {/* Help */}
              <div className="mt-4">
                <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-4 text-white">
                  <div className="text-sm font-medium mb-1">Need Help?</div>
                  <div className="text-xs opacity-90 mb-3">Contact support</div>
                  <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                    Get Support
                  </button>
                </div>
              </div>

              <div className="h-6"></div>
            </nav>
          </aside>
        </>
      )}

      {/*---------------------------------------------*/}
      {/* LOGOUT MODAL */}
      {/*---------------------------------------------*/}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
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
      <main className="flex-1 md:pl-72">{children}</main>
    </div>
  );
}
