"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Building,
  Calendar,
  Wrench,
  Bell,
  Bug,
  MessageSquareMore,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { ReceiptText } from "lucide-react";

import Swal from "sweetalert2";
import { MdOutlinePayments } from "react-icons/md";
import { BsFilePersonFill } from "react-icons/bs";
import { IoAnalytics } from "react-icons/io5";
import { FaFileContract } from "react-icons/fa";

const menuItems = [
  // Core - Priority for mobile
  {
    href: "/pages/landlord/dashboard",
    icon: Home,
    label: "Dashboard",
    priority: 1,
  },
  {
    href: "/pages/landlord/property-listing",
    icon: Building,
    label: "Properties",
    priority: 1,
  },
  {
    href: "/pages/landlord/list_of_tenants",
    icon: BsFilePersonFill,
    label: "Tenants",
    priority: 1,
  },
  {
    href: "/pages/landlord/payments",
    icon: MdOutlinePayments,
    label: "Payments",
    priority: 1,
  },

  // Secondary
  {
    href: "/pages/landlord/contracts",
    icon: FaFileContract,
    label: "Leases",
    priority: 2,
  },
  {
    href: "/pages/landlord/booking-appointment",
    icon: Calendar,
    label: "Bookings",
    priority: 2,
  },
  {
    href: "/pages/landlord/maintenance-request",
    icon: Wrench,
    label: "Maintenance",
    priority: 2,
  },
  {
    href: "/pages/landlord/chat",
    icon: MessageSquareMore,
    label: "Chats",
    priority: 2,
  },

  // Tertiary
  {
    href: "/pages/landlord/pdcManagement",
    icon: ReceiptText,
    label: "PDC Management",
    priority: 3,
  },
  {
    href: "/pages/landlord/analytics/performance",
    icon: IoAnalytics,
    label: "Analytics",
    priority: 3,
  },
  {
    href: "/pages/landlord/announcement",
    icon: Bell,
    label: "Announcements",
    priority: 3,
  },
  {
    href: "/pages/commons/bug-report",
    icon: Bug,
    label: "Support",
    priority: 3,
  },
];

const LandlordLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (label, href) => {
    setIsMobileMenuOpen(false);

    Swal.fire({
      title: "Loading...",
      text: "Redirecting to " + label,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    setTimeout(() => {
      router.push(href);
      Swal.close();
    }, 500);
  };

  const isActive = (href) => pathname === href;

  const primaryItems = menuItems.filter((item) => item.priority === 1);
  const secondaryItems = menuItems.filter((item) => item.priority === 2);
  const tertiaryItems = menuItems.filter((item) => item.priority === 3);

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:block fixed left-0 top-0 w-64 bg-white shadow-lg h-full overflow-y-auto z-30">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-emerald-600 bg-clip-text text-transparent">
            UpKeep
          </h1>
        </div>

        <nav className="px-4 pb-6">
          <ul className="space-y-1">
            {menuItems.map(({ href, icon: Icon, label }) => {
              const active = isActive(href);
              return (
                <li key={href} className="relative group">
                  <button
                    onClick={() => handleNavigation(label, href)}
                    className={`
                      flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200
                      ${
                        active
                          ? "bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 font-semibold shadow-sm"
                          : "hover:bg-gray-50 text-gray-700"
                      }
                    `}
                  >
                    <span
                      className={`
                        absolute left-0 top-0 h-full w-1 rounded-r 
                        bg-gradient-to-b from-blue-600 via-teal-500 to-emerald-400
                        ${
                          active
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }
                        transition-opacity duration-300
                      `}
                    />
                    <Icon
                      className={`w-5 h-5 mr-3 ${
                        active ? "text-blue-700" : "text-gray-500"
                      }`}
                    />
                    <span className="flex-1 text-left">{label}</span>
                    {active && (
                      <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="md:hidden fixed top-20 right-4 z-40">
        <button
          onClick={toggleMobileMenu}
          className={`
            p-4 rounded-full shadow-lg transition-all duration-300 transform
            ${
              isMobileMenuOpen
                ? "bg-red-500 hover:bg-red-600 rotate-90"
                : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 hover:scale-110"
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

      {isMobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 transition-opacity z-30"
            onClick={toggleMobileMenu}
          />

          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] overflow-hidden">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-emerald-600 bg-clip-text text-transparent">
                UpKeep Menu
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Navigate your dashboard
              </p>
            </div>

            <div className="overflow-y-auto max-h-[calc(75vh-100px)]">
              <nav className="p-4">
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 px-2">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {primaryItems.map(({ href, icon: Icon, label }) => {
                      const active = isActive(href);
                      return (
                        <button
                          key={href}
                          onClick={() => handleNavigation(label, href)}
                          className={`
                            flex flex-col items-center p-4 rounded-2xl transition-all duration-200 border-2
                            ${
                              active
                                ? "bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-200 text-blue-700"
                                : "bg-white border-gray-100 hover:border-gray-200 text-gray-700 hover:shadow-md"
                            }
                          `}
                        >
                          <div
                            className={`
                            p-3 rounded-xl mb-2
                            ${
                              active
                                ? "bg-gradient-to-r from-blue-100 to-emerald-100"
                                : "bg-gray-50"
                            }
                          `}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                active ? "text-blue-700" : "text-gray-500"
                              }`}
                            />
                          </div>
                          <span className="text-sm font-medium text-center">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 px-2">
                    Operations
                  </h3>
                  <div className="space-y-2">
                    {secondaryItems.map(({ href, icon: Icon, label }) => {
                      const active = isActive(href);
                      return (
                        <button
                          key={href}
                          onClick={() => handleNavigation(label, href)}
                          className={`
                            flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200
                            ${
                              active
                                ? "bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700"
                                : "hover:bg-gray-50 text-gray-700"
                            }
                          `}
                        >
                          <Icon
                            className={`w-5 h-5 mr-3 ${
                              active ? "text-blue-700" : "text-gray-500"
                            }`}
                          />
                          <span className="flex-1 text-left font-medium">
                            {label}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 ${
                              active ? "text-blue-700" : "text-gray-400"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 px-2">
                    More
                  </h3>
                  <div className="space-y-1">
                    {tertiaryItems.map(({ href, icon: Icon, label }) => {
                      const active = isActive(href);
                      return (
                        <button
                          key={href}
                          onClick={() => handleNavigation(label, href)}
                          className={`
                            flex items-center w-full px-4 py-2.5 rounded-lg transition-all duration-200
                            ${
                              active
                                ? "bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700"
                                : "hover:bg-gray-50 text-gray-600"
                            }
                          `}
                        >
                          <Icon
                            className={`w-4 h-4 mr-3 ${
                              active ? "text-blue-700" : "text-gray-500"
                            }`}
                          />
                          <span className="flex-1 text-left text-sm font-medium">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="h-6"></div>
              </nav>
            </div>
          </div>
        </>
      )}

      <div className="flex-1 md:ml-64 overflow-y-auto scrollbar-none">
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
};

export default LandlordLayout;
