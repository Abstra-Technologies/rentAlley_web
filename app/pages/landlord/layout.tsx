"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";

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
  Handshake,
} from "lucide-react";

/* ===============================
   LAZY COMPONENTS (BIG WIN)
================================ */
const NotificationSection = dynamic(
  () => import("@/components/notification/notifCenter"),
  { ssr: false },
);

const SendTenantInviteModal = dynamic(
  () => import("@/components/landlord/properties/sendInvite"),
  { ssr: false },
);

/* ===============================
   LAYOUT
================================ */
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
  const [authReady, setAuthReady] = useState(false);

  /* ===============================
       AUTH (NON-BLOCKING)
    ================================ */
  useEffect(() => {
    if (!user) {
      fetchSession().finally(() => setAuthReady(true));
    } else {
      setAuthReady(true);
    }
  }, [user, fetchSession]);

  useEffect(() => {
    if (authReady && user && user.userType !== "landlord") {
      router.replace("/pages/auth/login");
    }
  }, [authReady, user, router]);

  /* ===============================
       RESET MOBILE UI ON ROUTE CHANGE
    ================================ */
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsMobileProfileOpen(false);
  }, [pathname]);

  /* ===============================
       PREVENT BODY SCROLL WHEN SIDEBAR OPEN
    ================================ */
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

  /* ===============================
       FAST EXIT FOR PROPERTY SUBPAGES
    ================================ */
  const isInsideProperty = useMemo(
    () =>
      pathname.includes("/pages/landlord/properties/") &&
      !pathname.includes("/pages/commons/profile"),
    [pathname],
  );

  /* ===============================
       NAVIGATION (MEMOIZED)
    ================================ */
  const navLinks = useMemo(
    () => [
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
      { label: "Help & Support", href: "/pages/public/help", icon: Handshake },
    ],
    [],
  );

  const handleLogout = async () => {
    await signOut();
    router.push("/pages/auth/login");
  };

  /* ===============================
       AUTH LOADING (ONLY WHEN NEEDED)
    ================================ */
  if (!authReady) {
    return <LoadingScreen message="Preparing your workspace..." />;
  }

  if (!user || user.userType !== "landlord") {
    return <LoadingScreen message="Redirecting..." />;
  }

  if (isInsideProperty) {
    return <main className="min-h-screen">{children}</main>;
  }

  /* ===============================
       RENDER
    ================================ */
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-72 bg-white shadow-xl z-40">
        <div className="flex flex-col h-full">
          {/* HEADER */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
            <div className="flex justify-between items-center">
              <Link href="/pages/landlord/dashboard">
                <h1 className="text-2xl font-bold">Upkyp</h1>
              </Link>
              <NotificationSection user={user} admin={null} />
            </div>
            <p className="text-xs text-white/80">Landlord Portal</p>
          </div>

          {/* PROFILE */}
          <div className="px-4 py-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 flex-shrink-0">
                <Image
                  src={
                    user.profilePicture ||
                    "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                  }
                  alt="Profile"
                  width={44}
                  height={44}
                  className="rounded-xl object-cover w-full h-full border-2 border-gray-200"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.companyName || user.email}
                </p>
                <p className="text-xs text-gray-500">Landlord</p>
                {user.landlord_id && (
                  <p className="text-[11px] text-gray-400 truncate">
                    ID: {user.landlord_id}
                  </p>
                )}
              </div>

              <Link href="/pages/commons/profile">
                <Settings className="w-5 h-5 text-gray-500 hover:text-blue-600" />
              </Link>
            </div>
          </div>

          {/* NAV */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {navLinks.map(({ label, href, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                    ${
                      active
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* FOOTER */}
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-between px-4 z-50">
        <Link href="/pages/landlord/dashboard">
          <h1 className="text-xl font-bold text-white">Upkyp</h1>
        </Link>
        <div className="flex gap-2">
          <NotificationSection user={user} admin={null} />
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
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
            <h2 className="font-bold text-lg">Menu</h2>
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
                  "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                }
                alt="Profile"
                width={44}
                height={44}
                className="rounded-full border-2 border-white shadow-md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-gray-900">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.companyName || user.email}
                </p>
                <p className="text-xs text-gray-500">Landlord</p>
              </div>
              <Link
                href="/pages/commons/profile"
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-500" />
              </Link>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {navLinks.map(({ label, href, icon: Icon }, index) => {
              const active =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  style={{
                    animationDelay: isSidebarOpen ? `${index * 30}ms` : "0ms",
                  }}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Invite Button */}
          {user.landlord_id && (
            <div className="p-4 border-t">
              <SendTenantInviteModal landlord_id={user.landlord_id} />
            </div>
          )}

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>
      </div>

      {/* LOGOUT CONFIRM */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div
            className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100"
            style={{ animation: "modalPop 0.3s ease-out" }}
          >
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Are you sure you want to logout?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border border-gray-200 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 text-white rounded-xl py-3 font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:pl-72 pt-14 lg:pt-0">{children}</main>

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
