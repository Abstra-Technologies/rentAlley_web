'use client'
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { MdOutlineRssFeed, MdClose } from "react-icons/md";
import { HiMenuAlt3 } from "react-icons/hi";
import Link from "next/link";
import {
  HomeIcon,
  ClockIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { FaFile } from "react-icons/fa";
import { RiCommunityFill } from "react-icons/ri";
import { Menu, X, ChevronRight } from "lucide-react";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";

export default function TenantOutsidePortalNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [undecidedApplications, setUndecidedApplications] = useState(0);
  const { user } = useAuthStore();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user?.tenant_id) return;

    const fetchUndecidedApplications = async () => {
      try {
        const res = await fetch(
          `/api/tenant/applications/pendingApplications?tenant_id=${user?.tenant_id}`
        );
        const data = await res.json();
        setUndecidedApplications(data.count || 0);
      } catch (error) {
        console.error("Error fetching applications:", error);
      }
    };

    fetchUndecidedApplications();
  }, [user?.tenant_id]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (name, onClick) => {
    // Close mobile menu immediately for better UX
    setIsMobileMenuOpen(false);

    if (onClick) {
      Swal.fire({
        title: "Loading...",
        text: `Redirecting to ${name}`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      setTimeout(() => {
        onClick();
        Swal.close();
      }, 500);
    }
  };

  const handleClick_MyApplications = () => {
    router.push("/pages/tenant/myApplications");
  };

  const handleMyUnitsClick = () => {
    router.push("/pages/tenant/my-unit");
  };

  const handleFeedClick = () => {
    router.push("/pages/tenant/feeds");
  };

  const isActive = (path) => {
    return pathname === path;
  };

  const navigationItems = [
    {
      name: "Feeds",
      icon: MdOutlineRssFeed,
      onClick: handleFeedClick,
      path: "/pages/tenant/feeds",
      badge: null,
      priority: 1,
    },
    {
      name: "My Units",
      icon: RiCommunityFill,
      onClick: handleMyUnitsClick,
      path: "/pages/tenant/my-unit",
      badge: null,
      priority: 1,
    },
    {
      name: "My Applications",
      icon: FaFile,
      onClick: handleClick_MyApplications,
      path: "/pages/tenant/myApplications",
      badge: undecidedApplications > 0 ? undecidedApplications : null,
      priority: 2,
    },
    {
      name: "Unit History",
      icon: ClockIcon,
      onClick: () => router.push("/pages/tenant/unitHistory"),
      path: "#",
      badge: null,
      priority: 2,
    },
  ];

  // Group menu items for mobile
  const primaryItems = navigationItems.filter((item) => item.priority === 1);
  const secondaryItems = navigationItems.filter((item) => item.priority === 2);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar - Fixed and Sticky */}
      <div className="hidden md:block fixed left-0 top-16 w-64 bg-white shadow-lg h-[calc(100vh-4rem)] overflow-y-auto z-30 border-r border-gray-200">
        <div className="p-4">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-indigo-800 to-purple-600 bg-clip-text text-transparent"></h1>
        </div>

        <nav className="px-3 pb-4">
          <ul className="space-y-1">
            {navigationItems.map((item, index) => {
              const IconComponent = item.icon;
              const active = isActive(item.path);
              return (
                <li key={index} className="relative group">
                  <button
                    onClick={() => handleNavigation(item.name, item.onClick)}
                    className={`
                                            flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200 text-sm
                                            ${
                                              active
                                                ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium shadow-sm"
                                                : "hover:bg-gray-50 text-gray-700"
                                            }
                                        `}
                  >
                    <span
                      className={`
                                                absolute left-0 top-0 h-full w-0.5 rounded-r 
                                                bg-gradient-to-b from-indigo-600 to-purple-600
                                                ${
                                                  active
                                                    ? "opacity-100"
                                                    : "opacity-0 group-hover:opacity-100"
                                                }
                                                transition-opacity duration-300
                                            `}
                    />
                    <IconComponent
                      className={`w-4 h-4 mr-3 ${
                        active ? "text-indigo-700" : "text-gray-500"
                      }`}
                    />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mr-2">
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Help Section */}
        <div className="mx-3 mb-4">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-3 text-white">
            <div className="text-xs font-medium mb-1">Need Help?</div>
            <div className="text-xs opacity-90 mb-2">Contact support</div>
            <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded transition-colors backdrop-blur-sm">
              Get Support
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Button - Floating */}
      <div className="md:hidden fixed top-20 right-4 z-40">
        <button
          onClick={toggleMobileMenu}
          className={`
                        p-4 rounded-full shadow-lg transition-all duration-300 transform
                        ${
                          isMobileMenuOpen
                            ? "bg-red-500 hover:bg-red-600 rotate-90"
                            : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-110"
                        }
                    `}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Menu - Bottom Sheet Style */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40"
            onClick={toggleMobileMenu}
          />

          {/* Bottom Sheet Menu */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] overflow-hidden">
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-800 to-purple-600 bg-clip-text text-transparent">
                My Rental
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Manage your rental property
              </p>
            </div>

            {/* Navigation - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(75vh-140px)]">
              <nav className="p-4">
                {/* Essential Features - Primary Items */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 px-2">
                    Essential Features
                  </h3>
                  <div className="space-y-3">
                    {primaryItems.map((item, index) => {
                      const IconComponent = item.icon;
                      const active = isActive(item.path);
                      return (
                        <button
                          key={index}
                          onClick={() =>
                            handleNavigation(item.name, item.onClick)
                          }
                          className={`
                                                        flex items-center w-full p-4 rounded-2xl transition-all duration-200 border-2
                                                        ${
                                                          active
                                                            ? "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700"
                                                            : "bg-white border-gray-100 hover:border-gray-200 text-gray-700 hover:shadow-md"
                                                        }
                                                    `}
                        >
                          <div
                            className={`
                                                        p-3 rounded-xl mr-4
                                                        ${
                                                          active
                                                            ? "bg-gradient-to-r from-indigo-100 to-purple-100"
                                                            : "bg-gray-50"
                                                        }
                                                    `}
                          >
                            <IconComponent
                              className={`w-6 h-6 ${
                                active ? "text-indigo-700" : "text-gray-500"
                              }`}
                            />
                          </div>
                          <div className="flex-1 text-left">
                            <span className="font-medium">{item.name}</span>
                            {item.badge && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <ChevronRight
                            className={`w-5 h-5 ${
                              active ? "text-indigo-700" : "text-gray-400"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Features - Secondary Items */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 px-2">
                    Additional Features
                  </h3>
                  <div className="space-y-2">
                    {secondaryItems.map((item, index) => {
                      const IconComponent = item.icon;
                      const active = isActive(item.path);
                      return (
                        <button
                          key={index}
                          onClick={() =>
                            handleNavigation(item.name, item.onClick)
                          }
                          className={`
                                                        flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200
                                                        ${
                                                          active
                                                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                                                            : "hover:bg-gray-50 text-gray-700"
                                                        }
                                                    `}
                        >
                          <IconComponent
                            className={`w-5 h-5 mr-3 ${
                              active ? "text-indigo-700" : "text-gray-500"
                            }`}
                          />
                          <div className="flex-1 text-left">
                            <span className="font-medium">{item.name}</span>
                            {item.badge && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 ${
                              active ? "text-indigo-700" : "text-gray-400"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Help Section */}
                <div className="mb-4">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="text-sm font-medium mb-1">Need Help?</div>
                    <div className="text-xs opacity-90 mb-3">
                      Contact our support team
                    </div>
                    <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                      Get Support
                    </button>
                  </div>
                </div>

                {/* Bottom Padding for Safe Area */}
                <div className="h-6"></div>
              </nav>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
