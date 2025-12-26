"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";

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
  Inbox,
  AlertCircle,
  Handshake,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const NotificationSection = dynamic(
  () => import("@/components/notification/notifCenter"),
  { ssr: false }
);

const SendTenantInviteModal = dynamic(
  () => import("@/components/landlord/properties/sendInvite"),
  { ssr: false }
);

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchSession, signOut } = useAuthStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [authReady, setAuthReady] = useState(false);

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

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  const isInsideProperty = useMemo(
    () =>
      pathname.includes("/pages/landlord/properties/") &&
      !pathname.includes("/pages/commons/profile"),
    [pathname]
  );

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
    []
  );

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
    router.push("/pages/auth/login");
  };

  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + "/");

  if (!authReady) {
    return <LoadingScreen message="Preparing your workspace..." />;
  }

  if (!user || user.userType !== "landlord") {
    return <LoadingScreen message="Redirecting..." />;
  }

  if (isInsideProperty) {
    return <main className="min-h-screen">{children}</main>;
  }

  // Sidebar Content Component
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-5 py-5">
        <div className="flex items-center justify-between">
          <Link href="/pages/landlord/dashboard">
            <h1 className="text-2xl font-bold text-white">Upkyp</h1>
          </Link>
          <NotificationSection user={user} admin={null} />
        </div>
        <p className="text-xs text-white/80 mt-1">Landlord Portal</p>
      </div>

      {/* Profile Card */}
      <div className="p-4 border-b border-gray-100">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3">
            <Image
              src={user.profilePicture || "/avatar.png"}
              alt="Profile"
              width={44}
              height={44}
              className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.companyName || user.email}
              </p>
              <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3" />
                Landlord Account
              </p>
            </div>
            <Link
              href="/pages/commons/profile"
              className="p-2 hover:bg-white rounded-lg transition-all duration-200 group"
            >
              <Settings className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {navLinks.map(({ label, href, icon: Icon }, index) => {
            const active = isActive(href);
            return (
              <motion.li
                key={href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Link
                  href={href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active ? "" : "text-gray-400 group-hover:text-blue-600"
                    }`}
                  />
                  <span className="flex-1 text-sm font-medium">{label}</span>
                  {active && <ChevronRight className="w-4 h-4" />}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => {
            setIsSidebarOpen(false);
            setShowLogoutConfirm(true);
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl font-medium transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-emerald-50/20">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-72 bg-white shadow-xl z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-between px-4 z-50 shadow-lg">
        <Link href="/pages/landlord/dashboard">
          <h1 className="text-xl font-bold text-white">Upkyp</h1>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationSection user={user} admin={null} />
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Mobile Header */}
              <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Menu</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Profile */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Image
                    src={user.profilePicture || "/avatar.png"}
                    alt="Profile"
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.companyName || user.email}
                    </p>
                    <p className="text-xs text-gray-500">Landlord</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-3">
                <ul className="space-y-1">
                  {navLinks.map(({ label, href, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                            active
                              ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Invite Button */}
              {user.landlord_id && (
                <div className="p-4 border-t border-gray-100">
                  <SendTenantInviteModal landlord_id={user.landlord_id} />
                </div>
              )}

              {/* Logout */}
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl font-medium transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Confirm Logout
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Are you sure you want to logout?
                </p>
              </div>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:pl-72 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
