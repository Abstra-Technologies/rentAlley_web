
"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import useAuthStore from "../../zustand/authStore";
import axios from "axios";
import { useRouter } from "next/navigation";
import  NotificationSection  from "@/components/notification/notifCenter";

const Navbar = () => {
  const { user, admin, loading, signOut, signOutAdmin, fetchSession } =
      useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasLease, setHasLease] = useState(null);
  const router = useRouter();

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  // ✅ Check tenant lease
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

  // ✅ Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (
          mobileMenuRef.current &&
          !mobileMenuRef.current.contains(event.target) &&
          !event.target.classList.contains("mobile-menu-button") &&
          !event.target.closest(".mobile-menu-button")
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Responsive menu handler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
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

  // ✅ Navigation Links by Role
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

  return (
    <>
      <nav className="bg-gradient-to-r from-blue-800 to-emerald-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo - Responsive sizing */}
            <Link
              href={
                user?.userType === "tenant"
                  ? "/pages/tenant/feeds"
                  : user?.userType === "landlord"
                  ? "/pages/landlord/dashboard"
                  : "/"
              }
              className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center space-x-1 sm:space-x-2 transition-transform duration-300 hover:scale-105 flex-shrink-0"
            >
              <Image
                src="/upkyp.png"
                alt="UpKyp Logo"
                width={130}
                height={32}
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-4 lg:space-x-6 ml-auto mr-4 lg:mr-6">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative py-5 px-2 lg:px-3 font-medium hover:text-white text-blue-50 transition-all duration-200 group text-sm lg:text-base"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center w-10 sm:w-14 h-8">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : !user && !admin ? (
              <div className="hidden md:flex space-x-2 lg:space-x-3">
                <Link
                  href="/pages/auth/login"
                  className="px-4 lg:px-6 py-2.5 bg-white text-blue-600 rounded-lg font-medium transition-all duration-300 hover:bg-blue-50 hover:shadow-lg hover:scale-105 text-sm lg:text-base border border-white/20 hover:border-blue-200"
                >
                  Login
                </Link>
                <Link
                  href="/pages/auth/selectRole"
                  className="px-4 lg:px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 text-sm lg:text-base border border-emerald-400/50 hover:border-emerald-300"
                >
                  Register
                </Link>
              </div>
            ) : (
              // Authenticated Desktop Actions
              <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
                <NotificationSection user={user} admin={admin} />

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center space-x-1 lg:space-x-2 focus:outline-none group bg-white/10 hover:bg-white/20 rounded-lg p-2 transition-all duration-200 border border-white/20 hover:border-white/40"
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
                      className="w-8 h-8 lg:w-9 lg:h-9 object-cover rounded-full border-2 border-white/30 transition-transform duration-300 group-hover:scale-110 shadow-sm"
                    />
                    <div className="hidden xl:block">

                      <div className="text-sm font-medium leading-none">
                        {user?.companyName ||
                            (user?.firstName && user?.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user?.email) ||
                            (admin?.companyName ||
                                (admin?.first_name && admin?.last_name
                                    ? `${admin.first_name} ${admin.last_name}`
                                    : admin?.email))}
                      </div>

                      <div className="text-xs text-blue-100 opacity-80">
                        {user?.userType || "Admin"}
                      </div>
                    </div>
                    <svg
                      className={`w-3 h-3 lg:w-4 lg:h-4 ml-1 transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      ></path>
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white text-black rounded-xl shadow-xl py-2 z-10 transition-all duration-300 transform origin-top-right border border-gray-100">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-emerald-50">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.firstName ||
                            admin?.first_name + " " + admin?.last_name ||
                            "Guest"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email || admin?.email || ""}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user?.user_id}
                        </p>
                      </div>

                      {/* Points Section */}
                      {user && (
                        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-orange-50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Reward Points
                            </span>
                            <div className="flex items-center space-x-1">
                              <span className="text-lg font-bold text-orange-600">
                                {user?.points}
                              </span>
                              <span className="text-orange-500">⭐</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {user?.userType === "tenant" && !hasLease ? (
                        <div
                          className="flex items-center px-4 py-3 text-gray-400 cursor-not-allowed"
                          title="You need an active lease to access the dashboard"
                        >
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            ></path>
                          </svg>
                          Dashboard (Restricted)
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
                          className="flex items-center px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 transition-all duration-200 group"
                        >
                          <svg
                            className="w-4 h-4 mr-3 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            ></path>
                          </svg>
                          <span className="font-medium">Dashboard</span>
                        </Link>
                      )}

                      {user && (
                        <Link
                          href={`/pages/commons/profile`}
                          className="flex items-center px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 transition-all duration-200 group"
                        >
                          <svg
                            className="w-4 h-4 mr-3 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            ></path>
                          </svg>
                          <span className="font-medium">View Profile</span>
                        </Link>
                      )}

                      {user?.userType === "tenant" && (
                        <Link
                          href={`/pages/tenant/digital-passport`}
                          className="flex items-center px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 transition-all duration-200 group"
                        >
                          <svg
                            className="w-4 h-4 mr-3 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 12c2.28 0 4.09-1.8 4.09-4.09 0-2.28-1.8-4.09-4.09-4.09s-4.09 1.8-4.09 4.09C7.91 10.2 9.72 12 12 12zm0 2c-3.31 0-6 2.69-6 6h12c0-3.31-2.69-6-6-6z"
                            />
                          </svg>
                          <span className="font-medium">
                            My Digital Passport
                          </span>
                        </Link>
                      )}

                      {admin && (
                        <Link
                          href={`/pages/system_admin/profile/${admin.admin_id}`}
                          className="flex items-center px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 transition-all duration-200 group"
                        >
                          <svg
                            className="w-4 h-4 mr-3 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            ></path>
                          </svg>
                          <span className="font-medium">View Profile</span>
                        </Link>
                      )}

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-200 group"
                      >
                        <svg
                          className="w-4 h-4 mr-3 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          ></path>
                        </svg>
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center space-x-1 sm:space-x-2">
              {(user || admin) && (
                <NotificationSection user={user} admin={admin} />
              )}

              {user || admin ? (
                <button
                  onClick={toggleMenu}
                  className="mobile-menu-button focus:outline-none p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/20"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
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
                    className="w-8 h-8 object-cover rounded-full border-2 border-white/30 transition-transform duration-300 hover:scale-110 shadow-sm"
                  />
                </button>
              ) : (
                <button
                  onClick={toggleMenu}
                  className="mobile-menu-button focus:outline-none p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors duration-200 border border-transparent hover:border-white/20"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                >
                  <svg
                    className="w-6 h-6 text-white"
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
                </button>
              )}
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-60 transition-opacity duration-300 backdrop-blur-sm">
            <div
              ref={mobileMenuRef}
              className="fixed inset-y-0 right-0 max-w-sm w-full bg-gradient-to-b from-blue-600 via-blue-700 to-emerald-600 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto border-l-4 border-emerald-400"
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-emerald-500/30 bg-gradient-to-r from-blue-600/80 to-emerald-600/80 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-white/20 to-white/15 rounded-xl backdrop-blur-sm border border-white/30 shadow-lg">
                    <Image
                      src="/upkyptxt.png"
                      alt="UpKyp Logo"
                      width={80}
                      height={20}
                      priority
                      className="brightness-0 invert"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-gradient-to-r hover:from-white/25 hover:to-white/20 transition-all duration-200 backdrop-blur-sm border border-white/30 hover:border-white/50 shadow-lg"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="px-4 sm:px-6 py-4 space-y-2">
                {(user || admin) && (
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20 shadow-lg">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Image
                          src={
                            user?.profilePicture ||
                            admin?.profile_picture ||
                            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                          }
                          alt="Profile"
                          width={56}
                          height={56}
                          className="w-14 h-14 object-cover rounded-full border-3 border-white/30 shadow-lg"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-lg truncate">
                          {user?.firstName || admin?.firstName || "User"}
                        </div>
                        <div className="text-sm text-blue-100 truncate opacity-90">
                          {user?.email || admin?.email || ""}
                        </div>
                        {user && (
                          <div className="flex items-center space-x-1 mt-2">
                            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-2 py-1 rounded-lg border border-yellow-400/30 backdrop-blur-sm">
                              <span className="text-yellow-200 text-xs font-medium">
                                ⭐ {user?.points ?? 0} points
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {navigationLinks.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center py-4 px-4 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-200 text-white group border border-transparent hover:border-white/20 shadow-sm hover:shadow-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-white/20 to-white/10 rounded-xl flex items-center justify-center mr-3 group-hover:from-white/30 group-hover:to-white/20 transition-all border border-white/20 group-hover:border-white/40">
                        <span className="text-white text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <span className="font-medium">{link.label}</span>
                      <svg
                        className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 transition-opacity"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  ))}
                </div>

                {!user && !admin ? (
                  <div className="flex flex-col space-y-3 pt-6 border-t border-white/20 mt-6">
                    <Link
                      href="/pages/auth/login"
                      className="flex items-center justify-center py-4 bg-white text-blue-600 rounded-xl font-semibold transition-all duration-200 hover:bg-blue-50 shadow-lg hover:shadow-xl border border-white/20"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg
                        className="w-5 h-5 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      Login
                    </Link>
                    <Link
                      href="/pages/auth/selectRole"
                      className="flex items-center justify-center py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 backdrop-blur-sm rounded-xl font-semibold transition-all duration-200 hover:from-emerald-400 hover:to-emerald-300 border border-emerald-400/50 shadow-lg hover:shadow-xl"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                      Register
                    </Link>
                  </div>
                ) : (
                  <div className="pt-6 border-t border-white/20 mt-6 space-y-1">
                    {user?.userType === "tenant" && !hasLease ? (
                      <div className="flex items-center py-4 px-4 text-white/50 cursor-not-allowed rounded-xl border border-white/10 bg-white/5">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mr-3 border border-white/20">
                          <svg
                            className="w-4 h-4"
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
                        </div>
                        <span className="font-medium">
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
                        className="flex items-center py-4 px-4 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-200 group border border-transparent hover:border-white/20 shadow-sm hover:shadow-lg"
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-xl flex items-center justify-center mr-3 group-hover:from-blue-500/30 group-hover:to-blue-400/30 transition-all border border-blue-400/30 group-hover:border-blue-400/40">
                          <svg
                            className="w-4 h-4 text-blue-200"
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
                        </div>
                        <span className="font-medium">Dashboard</span>
                        <svg
                          className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    )}

                    {user && (
                      <Link
                        href={`/pages/${user.userType}/profile`}
                        className="flex items-center py-4 px-4 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-200 group border border-transparent hover:border-white/20 shadow-sm hover:shadow-lg"
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 rounded-xl flex items-center justify-center mr-3 group-hover:from-emerald-500/30 group-hover:to-emerald-400/30 transition-all border border-emerald-400/30 group-hover:border-emerald-400/40">
                          <svg
                            className="w-4 h-4 text-emerald-200"
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
                        </div>
                        <span className="font-medium">View Profile</span>
                        <svg
                          className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    )}

                    {user?.userType === "tenant" && (
                      <Link
                        href={`/pages/tenant/digital-passport`}
                        className="flex items-center py-4 px-4 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-200 group border border-transparent hover:border-white/20 shadow-sm hover:shadow-lg"
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-purple-400/20 rounded-xl flex items-center justify-center mr-3 group-hover:from-purple-500/30 group-hover:to-purple-400/30 transition-all border border-purple-400/30 group-hover:border-purple-400/40">
                          <svg
                            className="w-4 h-4 text-purple-200"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 12c2.28 0 4.09-1.8 4.09-4.09 0-2.28-1.8-4.09-4.09-4.09s-4.09 1.8-4.09 4.09C7.91 10.2 9.72 12 12 12zm0 2c-3.31 0-6 2.69-6 6h12c0-3.31-2.69-6-6-6z"
                            />
                          </svg>
                        </div>
                        <span className="font-medium">Digital Passport</span>
                        <svg
                          className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    )}

                    {admin && (
                      <Link
                        href={`/pages/system_admin/profile/${admin.admin_id}`}
                        className="flex items-center py-4 px-4 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-200 group border border-transparent hover:border-white/20 shadow-sm hover:shadow-lg"
                        onClick={() => setMenuOpen(false)}
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 rounded-xl flex items-center justify-center mr-3 group-hover:from-emerald-500/30 group-hover:to-emerald-400/30 transition-all border border-emerald-400/30 group-hover:border-emerald-400/40">
                          <svg
                            className="w-4 h-4 text-emerald-200"
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
                        </div>
                        <span className="font-medium">Admin Profile</span>
                        <svg
                          className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="flex items-center w-full py-4 px-4 rounded-xl text-red-200 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-400/20 hover:text-white transition-all duration-200 mt-4 group border border-red-400/20 hover:border-red-400/40 shadow-sm hover:shadow-lg"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-red-500/20 to-red-400/20 rounded-xl flex items-center justify-center mr-3 group-hover:from-red-500/30 group-hover:to-red-400/30 transition-all border border-red-400/30 group-hover:border-red-400/40">
                        <svg
                          className="w-4 h-4 text-red-200"
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
                      </div>
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/20">
                  <div className="text-center text-white/60 text-sm">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="mb-2 font-medium">UpKyp Rental Platform</p>
                      <p className="text-xs opacity-75">
                        Making rental simple & secure
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
