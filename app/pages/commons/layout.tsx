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

import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Home,
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
    icon: UserIcon,
    roles: ["tenant", "landlord", "admin"],
  },
  {
    href: "/pages/commons/profile/security",
    label: "Security & Privacy",
    icon: ShieldCheckIcon,
    roles: ["tenant", "landlord", "admin"],
  },
  {
    href: "/pages/commons/landlord/payoutDetails",
    label: "Payout Account",
    icon: CreditCardIcon,
    roles: ["landlord"],
  },
  {
    href: "/pages/commons/landlord/subscription",
    label: "View Subscription",
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

  const hasNavbar = user?.userType === "tenant";

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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      {/*---------------------------------------------*/}
      {/* DESKTOP SIDEBAR */}
      {/*---------------------------------------------*/}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:bottom-0 md:z-40 md:w-72 md:bg-white md:shadow-xl ${
          hasNavbar ? "md:top-16" : "md:top-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* HEADER */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm">
            <h1 className="text-lg font-bold text-white">Account Settings</h1>
            <p className="text-xs text-white/80 mt-1">
              Manage your personal information
            </p>
          </div>

          {/* Back Button */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => router.push(mainPageUrl)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-lg hover:from-blue-100 hover:to-emerald-100 transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-blue-600" />
              {mainPageLabel}
            </button>
          </div>

          {/* PROFILE HEADER */}
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
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.firstName
                    ? `${user.firstName} ${user.lastName}`
                    : user.companyName || user.email}
                </p>
                <p className="text-xs text-gray-500">
                  {user.userType === "landlord"
                    ? "Landlord Account"
                    : user.userType === "tenant"
                    ? "Tenant Account"
                    : "Admin Account"}
                </p>
              </div>
            </div>
          </div>

          {/* NAVIGATION LIST */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {filteredLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg"
                      : "text-gray-700 hover:bg-gray-100 hover:shadow-md"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/40 rounded-r-full" />
                  )}
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}

            {/* LOGOUT */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 hover:shadow-md w-full mt-2"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </nav>
        </div>
      </aside>

      {/*---------------------------------------------*/}
      {/* MOBILE MENU BUTTON */}
      {/*---------------------------------------------*/}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="md:hidden fixed bottom-24 right-6 z-50 p-4 rounded-full shadow-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-2xl transition-shadow"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/*---------------------------------------------*/}
      {/* MOBILE SIDEBAR */}
      {/*---------------------------------------------*/}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-4 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white flex justify-between items-center shadow-sm">
              <h2 className="text-lg font-bold">Account Settings</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PROMINENT BACK TO DASHBOARD BUTTON - AT THE TOP */}
            <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-b-2 border-blue-100 shadow-sm">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  router.push(mainPageUrl);
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
              >
                <Home className="w-5 h-5" />
                {mainPageLabel}
              </button>
            </div>

            {/* Mobile Profile */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
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
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {user.firstName
                      ? `${user.firstName} ${user.lastName}`
                      : user.companyName || user.email}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">
                    {user.userType} Account
                  </p>
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
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg"
                        : "bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md text-gray-700"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isActive ? "bg-white/20" : "bg-gray-50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
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
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors mt-4"
              >
                <div className="p-2 rounded-lg bg-red-100">
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">Logout</span>
              </button>
            </nav>
          </aside>
        </>
      )}

      {/*---------------------------------------------*/}
      {/* LOGOUT MODAL */}
      {/*---------------------------------------------*/}
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
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/*---------------------------------------------*/}
      {/* MAIN CONTENT */}
      {/*---------------------------------------------*/}
      <main className="flex-1 md:pl-72 pt-14 md:pt-0 bg-gradient-to-br from-gray-50 via-blue-50/20 to-emerald-50/20">
        {children}
      </main>
    </div>
  );
}
