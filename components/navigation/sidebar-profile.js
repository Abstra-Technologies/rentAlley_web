"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { Menu, X, ChevronRight } from "lucide-react";
import useAuthStore from "../../zustand/authStore";
import { logEvent } from "../../utils/gtag";

export default function SideNavProfile() {
  const { user, signOutAdmin, signOut } = useAuthStore();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const menuItems = [
    {
      href: `/pages/commons/profile`,
      icon: UserIcon,
      label: "Profile",
      onClick: () =>
        logEvent("Navigation", "User Interaction", "Clicked Profile Link", 1),
    },
    {
      href: `/pages/commons/profile/security`,
      icon: ShieldCheckIcon,
      label: "Security & Privacy",
      onClick: () =>
        logEvent(
          "Navigation",
          "User Interaction",
          "Clicked Security & Privacy Link",
          1
        ),
    },
    ...(user?.userType === "landlord"
      ? [
          {
            href: "/pages/landlord/subsciption_plan",
            icon: CreditCardIcon,
            label: "View Subscription",
            onClick: () => {},
          },
        ]
      : []),
    {
      href: "#",
      icon: ArrowRightOnRectangleIcon,
      label: "Logout",
      onClick: () => {
        if (!user) return;
        if (user?.userType) {
          signOut();
        } else {
          signOutAdmin();
        }
      },
    },
  ];

  // Separate items for mobile UI
  const primaryItems = menuItems.slice(0, -1);
  const logoutItem = menuItems[menuItems.length - 1];

  return (
    <div className="flex-shrink-0">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-16 w-64 bg-white shadow-lg h-[calc(100vh-4rem)] overflow-y-auto z-30 border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-800 to-emerald-600 bg-clip-text text-transparent">
            Account Menu
          </h1>
        </div>

        <nav className="px-3 pb-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const active = pathname === item.href;
              return (
                <li key={item.href + item.label} className="relative group">
                  <Link
                    href={item.href}
                    onClick={item.onClick}
                    className={`
                      flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200 text-sm
                      ${
                        active
                          ? "bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 font-medium shadow-sm"
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
                        active ? "text-blue-700" : "text-gray-500"
                      }`}
                    />
                    <span className="flex-1 text-left">{item.label}</span>
                    {active && (
                      <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600" />
                    )}
                  </Link>
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
      <div className="md:hidden fixed bottom-24 right-6 z-40">
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
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 transition-opacity z-30"
            onClick={toggleMobileMenu}
          />

          {/* Bottom Sheet Menu */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] overflow-hidden">
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-emerald-600 bg-clip-text text-transparent">
                Account Settings
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Manage your account preferences
              </p>
            </div>

            {/* Navigation - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(75vh-140px)]">
              <nav className="p-4">
                {/* Menu Items */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 px-2">
                    Settings
                  </h3>
                  <div className="space-y-3">
                    {primaryItems.map((item) => {
                      const IconComponent = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          onClick={() => {
                            toggleMobileMenu();
                            item.onClick && item.onClick();
                          }}
                          className={`
                            flex items-center w-full p-4 rounded-2xl transition-all duration-200 border-2
                            ${
                              active
                                ? "bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-200 text-blue-700"
                                : "bg-white border-gray-100 hover:border-gray-200 text-gray-700 hover:shadow-md"
                            }
                          `}
                        >
                          <div
                            className={`
                              p-3 rounded-xl mr-4
                              ${
                                active
                                  ? "bg-gradient-to-r from-blue-100 to-emerald-100"
                                  : "bg-gray-50"
                              }
                            `}
                          >
                            <IconComponent
                              className={`w-6 h-6 ${
                                active ? "text-blue-700" : "text-gray-500"
                              }`}
                            />
                          </div>
                          <div className="flex-1 text-left">
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <ChevronRight
                            className={`w-5 h-5 ${
                              active ? "text-blue-700" : "text-gray-400"
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Help Section */}
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-emerald-600 rounded-xl p-4 text-white">
                    <div className="text-sm font-medium mb-1">Need Help?</div>
                    <div className="text-xs opacity-90 mb-3">
                      Contact our support team
                    </div>
                    <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                      Get Support
                    </button>
                  </div>
                </div>

                {/* Logout Section */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 px-2">
                    Session
                  </h3>
                  <button
                    onClick={() => {
                      toggleMobileMenu();
                      logoutItem.onClick();
                    }}
                    className="flex items-center w-full p-4 rounded-2xl transition-all duration-200 border-2 bg-white border-red-100 hover:border-red-200 text-red-700 hover:shadow-md hover:bg-red-50"
                  >
                    <div className="p-3 rounded-xl mr-4 bg-red-50">
                      <logoutItem.icon className="w-6 h-6 text-red-700" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium">{logoutItem.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-400" />
                  </button>
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
