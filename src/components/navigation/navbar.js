"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { CiBellOn } from "react-icons/ci";
import useAuth from "../../../hooks/useSession";
import axios from "axios";

const Navbar = () => {
  const { user, admin, loading, signOut, signOutAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasLease, setHasLease] = useState(null);

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    if (user?.userType === "tenant" && user?.tenant_id) {
      const fetchLeaseStatus = async () => {
        try {
          const res = await axios.get(
            `/api/leaseAgreement/checkLease?tenant_id=${user?.tenant_id}`
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

  const fetchNotifications = async () => {
    if (!user && !admin) return;

    const userId = user?.user_id || admin?.admin_id;
    if (!userId) return;

    try {
      const res = await fetch(
        `/api/notification/get-notification?userId=${userId}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      } else {
        console.error("Failed to fetch notifications:", res.status);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(fetchNotifications, 5000);

    return () => clearInterval(intervalId);
  }, [user, admin]);

  useEffect(() => {
    const count = notifications.filter((notif) => !notif?.is_read).length;
    setUnreadCount(count);
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotifOpen(false);
      }

      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.classList.contains("mobile-menu-button")
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
    if (notifOpen) setNotifOpen(false);
  };

  const toggleNotifications = () => {
    setNotifOpen(!notifOpen);
    if (dropdownOpen) setDropdownOpen(false);
  };

  const handleLogout = async () => {
    if (admin) {
      await signOutAdmin();
    } else {
      await signOut();
    }
    setDropdownOpen(false);
  };

  const getNavigationLinks = () => {
    if (admin) {
      return [{ href: "/pages/system_admin/dashboard", label: "Dashboard" }];
    }

    if (!user) {
      return [
        { href: "/pages/about-us", label: "About Us" },
        { href: "/pages/partner", label: "Partner" },
        { href: "/pages/contact-us", label: "Contact Us" },
      ];
    }

    if (user?.userType === "tenant") {
      return [
        { href: "/pages/tenant/my-unit", label: "My Unit" },
        { href: "/pages/tenant/inbox", label: "Inbox" },
        { href: "/pages/find-rent", label: "Find Rent" },
        { href: "/pages/contact-us", label: "Contact Us" },
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

  const markAllAsRead = async () => {
    for (const notification of notifications) {
      if (!notification?.is_read) {
        try {
          const res = await fetch("/api/notification/get-notification", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: notification?.id }),
          });

          console.log(`Marking notification ${notification?.id} as read...`);

          if (!res.ok) {
            console.error("Failed to mark notification as read:", res.status);
          }
        } catch (error) {
          console.error("Error marking notification as read:", error);
        }
      }
    }

    setNotifications(
      notifications.map((notification) => ({ ...notification, is_read: true }))
    );
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href={
              user?.userType === "tenant"
                ? "/"
                : user?.userType === "landlord"
                ? "/pages/landlord/dashboard"
                : "/"
            }
            className="text-2xl font-bold flex items-center space-x-2 transition-transform duration-300 hover:scale-105"
          >
            <span className="text-3xl">🏠</span>
            <span>Rentahan</span>
          </Link>

          <div className="hidden md:flex space-x-6 ml-auto mr-6">
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative py-5 px-3 font-medium hover:text-white text-blue-50 transition-all duration-200 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center w-14 h-8">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : !user && !admin ? (
            <div className="hidden md:flex space-x-4">
              <Link
                href="/pages/auth/login"
                className="px-4 py-2 bg-white text-blue-600 rounded-md font-medium transition-all duration-300 hover:bg-gray-100 hover:shadow-md"
              >
                Login
              </Link>
              <Link
                href="/pages/auth/selectRole"
                className="px-4 py-2 bg-blue-800 rounded-md font-medium transition-all duration-300 hover:bg-blue-900 hover:shadow-md"
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={toggleNotifications}
                  className="relative focus:outline-none p-2 hover:bg-blue-600 rounded-full transition-colors duration-200"
                  aria-label="Notifications"
                >
                  <CiBellOn className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded-lg shadow-xl py-2 z-10 transition-all duration-300 transform origin-top-right">
                    <div className="flex justify-between items-center border-b px-4 pb-2">
                      <h3 className="text-gray-800 font-bold">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          onClick={() => markAllAsRead()}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-gray-600 text-center flex flex-col items-center">
                          <CiBellOn className="w-10 h-10 text-gray-400 mb-2" />
                          <p>No new notifications</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif?.id}
                            className="border-b hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                          >
                            <div className="px-4 py-3">
                              <p className="font-semibold text-gray-800">
                                {notif?.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notif?.body}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Just now
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="px-4 pt-2 border-t">
                        <Link
                          href={`/pages/${user.userType}/inbox`}
                          className="text-sm text-blue-600 hover:text-blue-800 block text-center transition-colors duration-200"
                        >
                          View all notifications
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 focus:outline-none group"
                >
                  <Image
                    src={
                      user?.profilePicture ||
                      admin?.profile_picture ||
                      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                    }
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-9 h-9 object-cover rounded-full border-2 border-white transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="hidden lg:block">
                    <div className="text-sm font-medium leading-none">
                      {user?.firstName || admin?.firstName || "User"}
                    </div>
                    <div className="text-xs text-blue-100">
                      {user?.userType || "Admin"}
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 ml-1 transition-transform duration-200 ${
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
                  <div className="absolute right-0 top-12 w-56 bg-white text-black rounded-lg shadow-xl py-2 z-10 transition-all duration-300 transform origin-top-right">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.firstName || admin?.firstName || "User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.email || admin?.email || ""}
                      </p>
                    </div>

                    {user?.userType === "tenant" && !hasLease ? (
                      <div
                        className="flex items-center px-4 py-2 text-gray-400 cursor-not-allowed"
                        title="You need an active lease to access the dashboard"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
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
                        href={`/pages/${
                          user?.userType || "system_admin"
                        }/dashboard`}
                        className="flex items-center px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
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
                        Dashboard
                      </Link>
                    )}

                    {user && (
                      <Link
                        href={`/pages/${user.userType}/profile/${user.user_id}`}
                        className="flex items-center px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
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
                        View Profile
                      </Link>
                    )}

                    {admin && (
                      <Link
                        href={`/pages/system_admin/profile/${admin.admin_id}`}
                        className="flex items-center px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
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
                        View Profile
                      </Link>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
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
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="md:hidden flex items-center space-x-2">
            {(user || admin) && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={toggleNotifications}
                  className="relative focus:outline-none p-2 hover:bg-blue-600 rounded-full transition-colors duration-200"
                  aria-label="Notifications"
                >
                  <CiBellOn className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={toggleMenu}
              className="text-white hover:text-gray-300 focus:outline-none mobile-menu-button p-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
            >
              <svg
                className={`w-6 h-6 transition-transform duration-300 ${
                  menuOpen ? "rotate-90" : ""
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
                  d="M4 6h16M4 12h16m-7 6h7"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden bg-blue-600 px-4 py-3 space-y-2 shadow-inner transition-all duration-300 transform origin-top"
        >
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center py-2 px-3 rounded-md hover:bg-blue-700 transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {!user && !admin ? (
            <div className="flex flex-col space-y-2 pt-2 border-t border-blue-500">
              <Link
                href="/pages/auth/login"
                className="flex items-center justify-center py-2 bg-white text-blue-600 rounded-md font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/pages/auth/selectRole"
                className="flex items-center justify-center py-2 bg-blue-800 rounded-md font-medium transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="flex flex-col space-y-1 pt-2 border-t border-blue-500">
              <div className="flex items-center space-x-3 px-3 py-2">
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
                <div>
                  <div className="font-medium">
                    {user?.firstName || admin?.firstName || "User"}
                  </div>
                  <div className="text-xs text-blue-100">
                    {user?.email || admin?.email || ""}
                  </div>
                </div>
              </div>

              <Link
                href={`/pages/${user?.userType || "system_admin"}/dashboard`}
                className="flex items-center py-2 px-3 rounded-md hover:bg-blue-700 transition-colors duration-200"
                onClick={() => setMenuOpen(false)}
              >
                <svg
                  className="w-5 h-5 mr-3"
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
                Dashboard
              </Link>

              {user && (
                <Link
                  href={`/pages/${user.userType}/profile/${user.user_id}`}
                  className="flex items-center py-2 px-3 rounded-md hover:bg-blue-700 transition-colors duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mr-3"
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
                  View Profile
                </Link>
              )}

              {admin && (
                <Link
                  href={`/pages/system_admin/profile/${admin.admin_id}`}
                  className="flex items-center py-2 px-3 rounded-md hover:bg-blue-700 transition-colors duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mr-3"
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
                  View Profile
                </Link>
              )}

              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="flex items-center py-2 px-3 rounded-md text-red-200 hover:bg-red-700 hover:text-white transition-colors duration-200 mt-2"
              >
                <svg
                  className="w-5 h-5 mr-3"
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
                Logout
              </button>
            </div>
          )}
        </div>
      )}

      {notifOpen && (
        <div className="md:hidden bg-white text-black px-4 py-2 shadow-lg absolute w-full z-20 transition-all duration-300 transform origin-top">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-gray-800 font-bold">Notifications</h3>
            {notifications.length > 0 && (
              <button
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                onClick={() => markAllAsRead()}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-6 text-gray-600 text-center flex flex-col items-center">
                <CiBellOn className="w-10 h-10 text-gray-400 mb-2" />
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif?.id}
                  className="border-b hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                >
                  <div className="py-3">
                    <p className="font-semibold text-gray-800">
                      {notif?.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{notif?.body}</p>
                    <p className="text-xs text-gray-400 mt-1">Just now</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="pt-2 border-t">
              <Link
                href={`/pages/${user.userType}/inbox`}
                className="text-sm text-blue-600 hover:text-blue-800 block text-center transition-colors duration-200"
                onClick={() => setNotifOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
