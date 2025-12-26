"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import useAuthStore from "@/zustand/authStore";
import axios from "axios";
import LoadingScreen from "@/components/loadingScreen";

import {
  Menu,
  X,
  Settings,
  LogOut,
  AlertCircle,
  MapPin,
  User,
  Search,
  MessageCircle,
  Home,
  FileText,
  Clock,
  Building2,
  Rss,
  ChevronRight,
  Sparkles,
  CreditCard,
  Bell,
  Wrench,
  Megaphone,
  MessageSquare,
} from "lucide-react";

export default function TenantLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchSession, signOut } = useAuthStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [undecidedApplications, setUndecidedApplications] = useState(0);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Portal context state
  const [isInPortalMode, setIsInPortalMode] = useState(false);
  const [portalAgreementId, setPortalAgreementId] = useState(null);
  const [portalPropertyInfo, setPortalPropertyInfo] = useState(null);
  const [portalValidated, setPortalValidated] = useState(false);

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

  // Shared pages that should PRESERVE the current sidebar context
  const sharedPages = ["/pages/tenant/chat", "/pages/commons/profile"];

  // Initialize portal state from localStorage on mount (for shared pages)
  useEffect(() => {
    const isSharedPage = sharedPages.some((page) => pathname.startsWith(page));

    if (isSharedPage && !isInPortalMode) {
      const storedAgreementId = localStorage.getItem("portalAgreementId");

      if (storedAgreementId) {
        // Restore portal context from localStorage
        async function restorePortalContext() {
          try {
            await axios.get(
              `/api/tenant/validate-agreement/${storedAgreementId}`
            );
            const res = await axios.get(
              "/api/tenant/activeRent/propertyUnitInfo",
              {
                params: { agreement_id: storedAgreementId },
              }
            );

            setIsInPortalMode(true);
            setPortalAgreementId(storedAgreementId);
            setPortalPropertyInfo(res.data);
            setPortalValidated(true);
          } catch {
            // Invalid stored agreement, clear it
            localStorage.removeItem("portalAgreementId");
          }
        }
        restorePortalContext();
      }
    }
  }, []); // Only run on mount

  // Check portal context on route changes
  useEffect(() => {
    const isPortalRoute = pathname.startsWith("/pages/tenant/rentalPortal");
    const isSharedPage = sharedPages.some((page) => pathname.startsWith(page));

    // If on a shared page, keep the current portal state (don't change anything)
    if (isSharedPage) {
      return;
    }

    // If NOT on a portal route and NOT on a shared page, exit portal mode
    if (!isPortalRoute) {
      setIsInPortalMode(false);
      setPortalAgreementId(null);
      setPortalPropertyInfo(null);
      setPortalValidated(false);
      return;
    }

    // On a portal route - validate the agreement
    const agreementId = localStorage.getItem("portalAgreementId");

    if (!agreementId) {
      setIsInPortalMode(false);
      setPortalAgreementId(null);
      setPortalPropertyInfo(null);
      setPortalValidated(false);
      return;
    }

    async function validatePortal() {
      try {
        await axios.get(`/api/tenant/validate-agreement/${agreementId}`);
        const res = await axios.get("/api/tenant/activeRent/propertyUnitInfo", {
          params: { agreement_id: agreementId },
        });

        setIsInPortalMode(true);
        setPortalAgreementId(agreementId);
        setPortalPropertyInfo(res.data);
        setPortalValidated(true);
      } catch {
        localStorage.removeItem("portalAgreementId");
        setIsInPortalMode(false);
        setPortalAgreementId(null);
        setPortalPropertyInfo(null);
        setPortalValidated(false);
        router.replace("/pages/tenant/my-unit");
      }
    }

    validatePortal();
  }, [pathname]);

  // Fetch pending applications
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Regular navigation items
  const navItems = [
    { name: "Feeds", href: "/pages/tenant/feeds", icon: Rss },
    { name: "Find Rent", href: "/pages/find-rent", icon: Search },
    { name: "Chats", href: "/pages/tenant/chat", icon: MessageCircle },
    { name: "My Units", href: "/pages/tenant/my-unit", icon: Building2 },
    {
      name: "My Applications",
      href: "/pages/tenant/myApplications",
      icon: FileText,
      badge: undecidedApplications > 0 ? undecidedApplications : null,
    },
    { name: "Unit History", href: "/pages/tenant/unitHistory", icon: Clock },
    {
      name: "Visit History",
      href: "/pages/tenant/visit-history",
      icon: MapPin,
    },
  ];

  // Portal navigation items
  const portalNavItems = [
    {
      name: "Dashboard",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}`,
      icon: Home,
    },
    {
      name: "Billing Statement",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}/billing`,
      icon: CreditCard,
    },
    {
      name: "Payment History",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}/paymentHistory`,
      icon: FileText,
    },
    {
      name: "Announcements",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}/announcement`,
      icon: Megaphone,
    },
    {
      name: "Maintenance",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}/maintenance`,
      icon: Wrench,
    },
    {
      name: "Chats",
      href: `/pages/tenant/chat`,
      icon: MessageSquare,
    },
  ];

  const isActive = (href) => {
    // For portal routes, use exact matching to prevent Dashboard from matching all routes
    if (isInPortalMode && href.includes("/rentalPortal/")) {
      return pathname === href;
    }
    // For other routes, allow startsWith for nested routes
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
    router.push("/pages/auth/login");
  };

  const handleExitPortal = () => {
    localStorage.removeItem("portalAgreementId");
    setIsInPortalMode(false);
    setPortalAgreementId(null);
    setPortalPropertyInfo(null);
    router.push("/pages/tenant/my-unit");
    setMobileMenuOpen(false);
  };

  if (isAuthChecking) {
    return <LoadingScreen message="Verifying your session..." />;
  }

  if (!user || user.userType !== "tenant") {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  // Sidebar Content Component
  const SidebarContent = ({ isPortal = false }) => {
    const items = isPortal ? portalNavItems : navItems;

    return (
      <>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <Link href="/pages/tenant/feeds" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Upkyp
            </span>
            {isPortal && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                Portal
              </span>
            )}
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            {isPortal ? "Rental Management" : "Tenant Dashboard"}
          </p>
        </div>

        {/* User/Property Card */}
        <div className="p-4 border-b border-gray-100">
          {isPortal && portalPropertyInfo ? (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-gray-900 line-clamp-2">
                    {portalPropertyInfo.property_name}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Unit{" "}
                    <span className="font-semibold">
                      {portalPropertyInfo.unit_name}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <Image
                  src={
                    user.profilePicture ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                  }
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-xl object-cover"
                  alt="profile"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-bold text-gray-900 truncate">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Tenant Account
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {items.map(({ href, name, icon: Icon, badge }, index) => {
              const active = isActive(href);
              return (
                <motion.li
                  key={href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
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
                    <span className="flex-1 text-sm font-medium">{name}</span>
                    {badge && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                        {badge}
                      </span>
                    )}
                    {active && <ChevronRight className="w-4 h-4" />}
                  </Link>
                </motion.li>
              );
            })}

            {/* Exit Portal Button */}
            {isPortal && (
              <li className="pt-3 mt-3 border-t border-gray-200">
                <button
                  onClick={handleExitPortal}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
                >
                  <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                  <span className="flex-1 text-sm font-medium text-left">
                    Exit Portal
                  </span>
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* Bottom Section */}
        {!isPortal && (
          <div className="p-3 border-t border-gray-100 space-y-1">
            <Link
              href="/pages/commons/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200 group"
            >
              <Settings className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              <span className="flex-1 text-sm font-medium">
                Account Settings
              </span>
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
              <span className="flex-1 text-sm font-medium text-left">
                Logout
              </span>
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {/* Mobile Menu Button - positioned on LEFT to avoid FeedbackWidget on right */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-40 w-14 h-14 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center text-white hover:shadow-xl hover:scale-105 transition-all duration-200"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <SidebarContent isPortal={isInPortalMode} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to sign out? You'll need to log in again
                to access your account.
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-emerald-50/20">
        {/* Desktop Sidebar - positioned below navbar (h-16 = 4rem) */}
        <aside className="hidden lg:flex lg:flex-col fixed left-0 top-16 w-72 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] z-20 shadow-sm">
          <SidebarContent isPortal={isInPortalMode} />
        </aside>

        {/* Main Content - no top padding needed, navbar spacer handles it */}
        <main className="flex-1 lg:pl-72">{children}</main>
      </div>
    </>
  );
}
