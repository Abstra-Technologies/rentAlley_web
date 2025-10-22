"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import useAuthStore from "../../zustand/authStore";
import axios from "axios";
import { useRouter } from "next/navigation";
import NotificationSection from "@/components/notification/notifCenter";

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

  // Check tenant lease
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

  // Handle clicks outside dropdowns
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

  // Navigation Links by Role
  const getNavigationLinks = () => {
    if (admin) {
      return [{ href: "/system_admin/dashboard", label: "Dashboard" }];
    }

    if (!user) {
      return [
        { href: "/pages/about-us", label: "About Us" },
        { href: "/pages/find-rent", label: "Find Rent" },
        { href: "/pages/public/download", label: "Download App" },
        { href: "/pages/partner", label: "Partner" },
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

    if (user?.userType === "landlord") {
      return [
        { href: "/pages/landlord/inbox", label: "Inbox" },
        { href: "/pages/landlord/dashboard", label: "Dashboard" },
      ];
    }

    return [];
  };

  const navigationLinks = getNavigationLinks();

  // Get mobile navigation tabs
  const getMobileNavTabs = () => {
    if (admin) {
      return [
        {
          href: "/system_admin/dashboard",
          label: "Dashboard",
          icon: "dashboard",
        },
        {
          href: "/pages/system_admin/profile/" + admin.admin_id,
          label: "Profile",
          icon: "profile",
        },
      ];
    }

    if (!user) {
      return [];
    }

    if (user?.userType === "tenant") {
      return [
        { href: "/pages/tenant/feeds", label: "Feed", icon: "feed" },
        { href: "/pages/find-rent", label: "Find", icon: "search" },
        { href: "/pages/tenant/chat", label: "Chat", icon: "chat" },
        {
          href: "/pages/tenant/visit-history",
          label: "Bookings",
          icon: "bookings",
        },
        { href: "/pages/commons/profile", label: "Profile", icon: "profile" },
      ];
    }

    if (user?.userType === "landlord") {
      return [
        {
          href: "/pages/landlord/dashboard",
          label: "Dashboard",
          icon: "dashboard",
        },
        { href: "/pages/landlord/inbox", label: "Inbox", icon: "inbox" },
        { href: "/pages/commons/profile", label: "Profile", icon: "profile" },
      ];
    }

    return [];
  };

  const renderMobileIcon = (icon) => {
    const iconClass = "w-5 h-5";
    switch (icon) {
      case "feed":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        );
      case "search":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        );
      case "chat":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case "bookings":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case "inbox":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        );
      case "dashboard":
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        );
      case "profile":
      default:
        return (
          <svg
            className={iconClass}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
    }
  };

  const mobileNavTabs = getMobileNavTabs();

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg sticky top-0 z-50 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              href={
                user?.userType === "tenant"
                  ? "/pages/tenant/feeds"
                  : user?.userType === "landlord"
                  ? "/pages/landlord/dashboard"
                  : "/"
              }
              className="flex items-center space-x-2 transition-opacity hover:opacity-80 flex-shrink-0"
            >
              <Image
                src="/upkyp.png"
                alt="UpKyp Logo"
                width={120}
                height={30}
                priority
                className="h-8 w-auto"
              />
            </Link>

            {/* Desktop Navigation - Centered */}
            <div className="hidden md:flex items-center space-x-1 absolute left-1/2 transform -translate-x-1/2">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center w-14 h-8">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
              </div>
            ) : !user && !admin ? (
              <div className="hidden md:flex items-center space-x-3">
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
              // Authenticated Desktop Actions
              <div className="hidden md:flex items-center space-x-3">
                <NotificationSection user={user} admin={admin} />

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-all duration-200 group border border-white/20 hover:border-white/40"
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
                      className="w-8 h-8 object-cover rounded-full border-2 border-white/40 group-hover:border-white transition-all"
                    />
                    <div className="hidden lg:block text-left">
                      <div className="text-sm font-medium text-white leading-tight">
                        {user?.companyName ||
                          (user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user?.email) ||
                          admin?.companyName ||
                          (admin?.first_name && admin?.last_name
                            ? `${admin.first_name} ${admin.last_name}`
                            : admin?.email)}
                      </div>
                      <div className="text-xs text-white/80 capitalize">
                        {user?.userType || "Admin"}
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-white/80 transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-14 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10 transition-all duration-200">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
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
                            className="w-10 h-10 object-cover rounded-full border-2 border-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user?.firstName ||
                                admin?.first_name + " " + admin?.last_name ||
                                "Guest"}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user?.email || admin?.email || ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Points Section */}
                      {user && (
                        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">⭐</span>
                              <span className="text-sm font-medium text-gray-700">
                                Reward Points
                              </span>
                            </div>
                            <span className="text-lg font-bold text-orange-600">
                              {user?.points || 0}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Menu Items */}
                      <div className="py-1">
                        {user?.userType === "tenant" && !hasLease ? (
                          <div
                            className="flex items-center px-4 py-2.5 text-gray-400 cursor-not-allowed"
                            title="You need an active lease to access the dashboard"
                          >
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                            <span className="text-sm">
                              Dashboard (Restricted)
                            </span>
                          </div>
                        ) : (
                          <Link
                            href={
                              user?.userType === "tenant"
                                ? "/pages/tenant/my-unit"
                                : `/pages/${
                                    user?.userType || "system_admin"
                                  }/dashboard`
                            }
                            className="flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-gray-400 group-hover:text-emerald-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                              Dashboard
                            </span>
                          </Link>
                        )}

                        {user && (
                          <Link
                            href={`/pages/commons/profile`}
                            className="flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-gray-400 group-hover:text-emerald-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                              View Profile
                            </span>
                          </Link>
                        )}

                        {user?.userType === "tenant" && (
                          <Link
                            href={`/pages/tenant/digital-passport`}
                            className="flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-gray-400 group-hover:text-emerald-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                              />
                            </svg>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                              Digital Passport
                            </span>
                          </Link>
                        )}

                        {admin && (
                          <Link
                            href={`/pages/system_admin/profile/${admin.admin_id}`}
                            className="flex items-center px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                          >
                            <svg
                              className="w-4 h-4 mr-3 text-gray-400 group-hover:text-emerald-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                              View Profile
                            </span>
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors group"
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
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
      </nav>

      {/* Mobile Navbar - Top Bar Only */}
      <nav className="md:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-lg z-50 h-16">
        <div className="flex justify-between items-center h-full px-4">
          {/* Logo/Branding */}
          <Link
            href={
              user?.userType === "tenant"
                ? "/pages/tenant/feeds"
                : user?.userType === "landlord"
                ? "/pages/landlord/dashboard"
                : "/"
            }
            className="flex items-center space-x-2 transition-opacity hover:opacity-80 flex-shrink-0"
          >
            <Image
              src="/upkyp.png"
              alt="UpKyp Logo"
              width={100}
              height={25}
              priority
              className="h-6 w-auto"
            />
          </Link>

          {/* Right Actions */}
          {loading ? (
            <div className="flex items-center justify-center w-8 h-8">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            </div>
          ) : !user && !admin ? (
            <div className="flex items-center space-x-2">
              <Link
                href="/pages/auth/login"
                className="px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 rounded transition-all"
              >
                Login
              </Link>
              <Link
                href="/pages/auth/selectRole"
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-white rounded transition-all"
              >
                Start
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <NotificationSection user={user} admin={admin} />
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Tab Navigation */}
      {(user || admin) && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40">
          <div className="flex justify-around items-center h-16">
            {mobileNavTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all duration-200 group relative"
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="text-gray-400 group-hover:text-emerald-600 transition-colors">
                    {renderMobileIcon(tab.icon)}
                  </div>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-600">
                    {tab.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Spacer to prevent content overlap on mobile */}
      {(user || admin) && <div className="md:hidden h-16" />}
    </>
  );
};

export default Navbar;
