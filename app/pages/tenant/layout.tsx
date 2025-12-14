"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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
  Search,
  MessageCircle,
} from "lucide-react";
import { MdOutlineRssFeed } from "react-icons/md";
import { RiCommunityFill } from "react-icons/ri";
import { FaFile } from "react-icons/fa";
import {
  ClockIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BellIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

import Image from "next/image";
import LoadingScreen from "@/components/loadingScreen";
import axios from "axios";

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

  // Draggable button state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showHint, setShowHint] = useState(false);
  const buttonRef = useRef(null);

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

  // Check portal context - SIMPLIFIED VERSION
    useEffect(() => {
        const agreementId = localStorage.getItem("portalAgreementId");

        // No agreement → definitely not in portal
        if (!agreementId) {
            setIsInPortalMode(false);
            setPortalAgreementId(null);
            setPortalPropertyInfo(null);
            setPortalValidated(false);
            return;
        }

        // 🔐 SERVER VALIDATION (CRITICAL)
        axios
            .get("/api/tenant/activeRent/propertyUnitInfo", {
                params: { agreement_id: agreementId },
            })
            .then((res) => {
                // ✅ Server confirms ownership
                setIsInPortalMode(true);
                setPortalAgreementId(agreementId);
                setPortalPropertyInfo(res.data);
                setPortalValidated(true);
            })
            .catch((err) => {
                // ❌ NOT OWNER / EXPIRED LEASE
                console.warn("Portal access denied");

                localStorage.removeItem("portalAgreementId");

                setIsInPortalMode(false);
                setPortalAgreementId(null);
                setPortalPropertyInfo(null);
                setPortalValidated(false);

                router.replace("/pages/tenant/my-unit");
            });
    }, [pathname]);

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

  // Initialize button position from localStorage or default
  useEffect(() => {
    const positionKey = isInPortalMode
      ? "portalBurgerMenuPosition"
      : "burgerMenuPosition";
    const savedPosition = localStorage.getItem(positionKey);
    const hasSeenHint = localStorage.getItem("burgerMenuHintSeen");

    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    } else {
      // Default position: bottom-right
      setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 160 });
    }

    // Show hint for first-time users
    if (!hasSeenHint && !isInPortalMode) {
      setShowHint(true);
      setTimeout(() => {
        setShowHint(false);
        localStorage.setItem("burgerMenuHintSeen", "true");
      }, 3000);
    }
  }, [isInPortalMode]);

  // Handle touch/mouse start
  const handleDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setShowHint(false);

    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  // Handle touch/mouse move
  const handleDragMove = (e) => {
    if (!isDragging) return;

    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;

    // Constrain to viewport
    const buttonSize = 56;
    const maxX = window.innerWidth - buttonSize;
    const maxY = window.innerHeight - buttonSize;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  // Handle touch/mouse end
  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      const positionKey = isInPortalMode
        ? "portalBurgerMenuPosition"
        : "burgerMenuPosition";
      localStorage.setItem(positionKey, JSON.stringify(position));
    }
  };

  // Add event listeners for drag
  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => handleDragMove(e);
      const handleEnd = () => handleDragEnd();

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("touchend", handleEnd);

      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("touchend", handleEnd);
      };
    }
  }, [isDragging, dragStart, position]);

  // Regular navigation items
  const navItems = [
    {
      name: "Feeds",
      href: "/pages/tenant/feeds",
      path: "/pages/tenant/feeds",
      icon: MdOutlineRssFeed,
      badge: null,
    },
    {
      name: "Find Rent",
      href: "/pages/find-rent",
      path: "/pages/find-rent",
      icon: Search,
      badge: null,
    },
    {
      name: "Chats",
      href: "/pages/tenant/chat",
      path: "/pages/tenant/chat",
      icon: MessageCircle,
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

  // Portal navigation items
  const portalNavItems = [
    {
      name: "Dashboard",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}`,
      icon: HomeIcon,
    },
    {
      name: "Billing Statement",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}/billing`,
      icon: CreditCardIcon,
    },
    {
      name: "Payment History",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}/paymentHistory`,
      icon: DocumentTextIcon,
    },
    {
      name: "Announcements",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}/announcement`,
      icon: BellIcon,
    },
    {
      name: "Maintenance",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}/maintenance`,
      icon: WrenchScrewdriverIcon,
    },
    {
      name: "Chats",
      href: `/pages/tenant/chat`,
      icon: ChatBubbleLeftRightIcon,
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

  const handleExitPortal = () => {
    // Clear ONLY the agreement ID
    localStorage.removeItem("portalAgreementId");

    // Update state
    setIsInPortalMode(false);
    setPortalAgreementId(null);
    setPortalPropertyInfo(null);

    // Navigate away
    router.push("/pages/tenant/my-unit");
    setMobileMenuOpen(false);
  };

  // Show loading screen during auth check
  if (isAuthChecking) {
    return <LoadingScreen message="Verifying your session..." />;
  }

  // Show loading screen if user is not authenticated or wrong user type
  if (!user || user.userType !== "tenant") {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  // Regular Sidebar Content
  const RegularSidebarContent = () => (
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

  // Portal Sidebar Content
  const PortalSidebarContent = () => (
    <>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          Upkyp Portal
        </h1>
        <p className="text-xs text-gray-500 mt-1">Rental Management</p>
      </div>

      {/* Property Info Card */}
      <div className="p-4 border-b border-gray-200">
        {portalPropertyInfo ? (
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <BuildingOfficeIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">
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
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg p-4 border border-blue-100 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {portalNavItems.map(({ href, name, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href);

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
                    className={`w-5 h-5 mr-3 flex-shrink-0 ${
                      active ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  <span className="flex-1 text-left">{name}</span>
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                  )}
                </button>
              </li>
            );
          })}

          {/* Exit Portal */}
          <li className="pt-2 border-t border-gray-200 mt-2">
            <button
              onClick={handleExitPortal}
              className="flex items-center w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 group"
            >
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0 text-gray-400 group-hover:text-red-600" />
              <span className="flex-1 text-left">Exit Portal</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );

  return (
    <>
      {/* Draggable Mobile Menu Button */}
      <div className="md:hidden">
        <button
          ref={buttonRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onClick={(e) => {
            if (!isDragging) {
              setMobileMenuOpen(true);
            }
          }}
          className="fixed z-40 w-14 h-14 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow touch-none"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            cursor: isDragging ? "grabbing" : "grab",
            transition: isDragging ? "none" : "box-shadow 0.2s",
          }}
          aria-label="Open menu"
        >
          <Bars3Icon className="w-6 h-6 pointer-events-none" />

          {!isDragging && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
            </div>
          )}
        </button>

        {/* Hint Tooltip */}
        {showHint && !isDragging && !isInPortalMode && (
          <div
            className="fixed z-50 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg animate-bounce"
            style={{
              left: `${position.x - 80}px`,
              top: `${position.y - 40}px`,
            }}
          >
            Drag me anywhere! 👋
          </div>
        )}
      </div>

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
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>

            {/* Conditional Sidebar Content */}
            {isInPortalMode ? (
              <PortalSidebarContent />
            ) : (
              <RegularSidebarContent />
            )}
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
        {/* Desktop Sidebar - Shows portal or regular content based on context */}
        <aside className="hidden lg:flex lg:flex-col fixed left-0 top-14 w-72 bg-white border-r border-gray-200 h-[calc(100vh-3.5rem)] z-20">
          {isInPortalMode ? (
            <PortalSidebarContent />
          ) : (
            <RegularSidebarContent />
          )}
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 lg:pl-72 pt-14 lg:pt-0 bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20">
          {children}
        </main>
      </div>
    </>
  );
}
