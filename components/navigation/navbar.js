"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import useAuthStore from "../../zustand/authStore";
import axios from "axios";
import { useRouter } from "next/navigation";
import NotificationSection from "@/components/notification/notifCenter";
import {
  Home,
  Search,
  MessageSquare,
  Calendar,
  User,
  Inbox,
  LayoutDashboard,
  ChevronDown,
  LogOut,
  Settings,
  CreditCard,
  Star,
} from "lucide-react";

const Navbar = () => {
  const { user, admin, loading, signOut, signOutAdmin, fetchSession } =
    useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasLease, setHasLease] = useState(null);
  const router = useRouter();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  useEffect(() => {
    if (user?.userType === "tenant" && user?.tenant_id) {
      const fetchLeaseStatus = async () => {
        try {
          const res = await axios.get(
            `/api/leaseAgreement/checkCurrentLease?tenant_id=${user?.tenant_id}`
          );
          setHasLease(res?.data?.hasLease);
        } catch (error) {
          console.error("Error fetching lease status:", error);
          setHasLease(false);
        }
      };
      fetchLeaseStatus();
    }
  }, [user?.tenant_id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = async () => {
    if (admin) {
      await signOutAdmin();
      router.push("/pages/admin_login");
    } else {
      await signOut();
      router.push("/pages/auth/login");
    }
    setDropdownOpen(false);
  };

  const getNavigationLinks = () => {
    if (admin) {
      return [{ href: "/system_admin/dashboard", label: "Dashboard" }];
    }

    if (!user) {
      return [
        { href: "/pages/about-us", label: "About Us" },
        { href: "/pages/public/how-it-works", label: "How It Works" },
        { href: "/pages/find-rent", label: "Find Rent" },
        { href: "/pages/public/download", label: "Download App" },
                { href: "/pages/find-rent", label: "Pricing" },

        // { href: "/pages/partner", label: "Partner" },
        { href: "/pages/contact-us", label: "Contact Us" },
      ];
    }

    if (user?.userType === "tenant") {
      return [
        { href: "/pages/tenant/my-unit", label: "My Unit" },
        { href: "/pages/find-rent", label: "Find Rent" },
        { href: "/pages/tenant/visit-history", label: "My Bookings" },
        { href: "/pages/tenant/chat", label: "Chat" },
      ];
    }

    // Landlords don't use the navbar anymore - they use the sidebar
    if (user?.userType === "landlord") {
      return [];
    }

    return [];
  };

  const navigationLinks = getNavigationLinks();

  const getMobileNavTabs = () => {
    if (admin) {
      return [
        {
          href: "/system_admin/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/pages/system_admin/profile/" + admin.admin_id,
          label: "Profile",
          icon: User,
        },
      ];
    }

    if (!user) {
      return [];
    }

    if (user?.userType === "tenant") {
      return [
        { href: "/pages/tenant/feeds", label: "Explore", icon: Home },
        { href: "/pages/find-rent", label: "Browse", icon: Search },
        { href: "/pages/tenant/chat", label: "Chat", icon: MessageSquare },
        {
          href: "/pages/tenant/visit-history",
          label: "Bookings",
          icon: Calendar,
        },
        { href: "/pages/commons/profile", label: "Profile", icon: User },
      ];
    }

    // Landlords don't use the mobile navbar anymore - they use the sidebar
    if (user?.userType === "landlord") {
      return [];
    }

    return [];
  };

  const mobileNavTabs = getMobileNavTabs();

  // Don't render navbar for landlords
  if (user?.userType === "landlord") {
    return null;
  }

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg sticky top-0 z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              href={user?.userType === "tenant" ? "/pages/tenant/feeds" : "/"}
              className="flex text-3xl items-center space-x-2 transition-opacity hover:opacity-90 text-white font-bold"
            >
              Upkyp
            </Link>

            <div className="flex items-center space-x-1 ml-auto">
              {/* Navigation Links */}
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}

              {/* Loading State */}
              {loading ? (
                <div className="flex items-center justify-center w-14 h-8">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                </div>
              ) : !user && !admin ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/pages/auth/login"
                    className="px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/pages/auth/selectRole"
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                  >
                    Get Started
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <NotificationSection user={user} admin={admin} />

                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={toggleDropdown}
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
                    >
                      <Image
                        src={
                          user?.profilePicture ||
                          admin?.profile_picture ||
                          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                        }
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-8 h-8 object-cover rounded-full border-2 border-white/30"
                      />
                      <div className="hidden lg:block text-left">
                        <div className="text-sm font-medium text-white leading-tight">
                          {user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user?.companyName ||
                              (admin?.first_name && admin?.last_name)
                            ? `${admin.first_name} ${admin.last_name}`
                            : user?.email || admin?.email}
                        </div>
                        <div className="text-xs text-white/70 capitalize">
                          {user?.userType || (admin ? "Admin" : "")}
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-white/80 transition-transform duration-200 ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                        {/* User Info */}
                        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <Image
                              src={
                                user?.profilePicture ||
                                admin?.profile_picture ||
                                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                              }
                              alt="Profile"
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded-full border-2 border-white"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {user?.firstName
                                  ? `${user.firstName} ${user.lastName || ""}`
                                  : admin?.first_name
                                  ? `${admin.first_name} ${
                                      admin.last_name || ""
                                    }`
                                  : "User"}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user?.email || admin?.email || ""}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Points Section for Users */}
                        {user?.points !== undefined && (
                          <div className="px-4 py-3 bg-amber-50 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-500" />
                                <span className="text-sm font-medium text-gray-700">
                                  Reward Points
                                </span>
                              </div>
                              <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                {user.points}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Menu Items */}
                        <div className="py-2">
                          {/* Dashboard Link */}
                          {user?.userType === "tenant" && !hasLease ? (
                            <div className="px-4 py-2.5 flex items-center gap-3 text-gray-400 cursor-not-allowed">
                              <LayoutDashboard className="w-4 h-4" />
                              <div>
                                <p className="text-sm font-medium">Dashboard</p>
                                <p className="text-xs">Requires active lease</p>
                              </div>
                            </div>
                          ) : (
                            <Link
                              href={
                                user?.userType === "tenant"
                                  ? "/pages/tenant/my-unit"
                                  : "/system_admin/dashboard"
                              }
                              className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                            >
                              <LayoutDashboard className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">
                                Dashboard
                              </span>
                            </Link>
                          )}

                          {/* Profile Link */}
                          {user && (
                            <Link
                              href="/pages/commons/profile"
                              className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                            >
                              <User className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">
                                View Profile
                              </span>
                            </Link>
                          )}

                          {admin && (
                            <Link
                              href={`/pages/system_admin/profile/${admin.admin_id}`}
                              className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                            >
                              <User className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">
                                View Profile
                              </span>
                            </Link>
                          )}

                          {/* Digital Passport for Tenants */}
                          {user?.userType === "tenant" && (
                            <Link
                              href="/pages/tenant/digital-passport"
                              className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                            >
                              <CreditCard className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">
                                Digital Passport
                              </span>
                            </Link>
                          )}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-100">
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2.5 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar - Top Bar */}
      <nav className="md:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg z-50 h-14">
        <div className="flex justify-between items-center h-full px-4">
          {/* Logo */}
          <Link
            href={user?.userType === "tenant" ? "/pages/tenant/feeds" : "/"}
            className="flex items-center"
          >
            <Image
              src="/upkyp.png"
              alt="UpKyp"
              width={80}
              height={20}
              priority
              className="h-6 w-auto"
            />
          </Link>

          {/* Right Actions */}
          {loading ? (
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
            </div>
          ) : !user && !admin ? (
            <div className="flex items-center gap-2">
              <Link
                href="/pages/auth/login"
                className="px-3 py-1.5 text-xs font-medium text-white bg-white/20 rounded-lg"
              >
                Login
              </Link>
              <Link
                href="/pages/auth/selectRole"
                className="px-3 py-1.5 text-xs font-medium bg-white text-blue-600 rounded-lg"
              >
                Start
              </Link>
            </div>
          ) : (
            <NotificationSection user={user} admin={admin} />
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      {(user || admin) && mobileNavTabs.length > 0 && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="flex justify-around items-center h-16 px-2">
            {mobileNavTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center justify-center flex-1 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;
