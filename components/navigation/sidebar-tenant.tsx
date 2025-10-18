"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Bell,
  MessageCircle,
  Wrench,
  CreditCard,
  Menu,
  X,
  ReceiptText,
  ChevronRight,
  LogOut,
} from "lucide-react";
import axios from "axios";

interface TenantLayoutProps {
  children: React.ReactNode;
  agreement_id?: string | number;
}

const TenantLayout = ({ children, agreement_id }: TenantLayoutProps) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [propertyInfo, setPropertyInfo] = useState<{
    property_name: string;
    unit_name: string;
  } | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    if (!agreement_id) return;

    const fetchPropertyUnitInfo = async () => {
      try {
        const res = await axios.get(`/api/tenant/activeRent/propertyUnitInfo`, {
          params: { agreement_id },
        });
        setPropertyInfo(res.data);
      } catch (error) {
        console.error("Failed to fetch property info:", error);
      }
    };

    fetchPropertyUnitInfo();
  }, [agreement_id]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (href: string) => {
    setIsMobileMenuOpen(false);
    router.push(href);
  };

  const menuItems = [
    {
      slug: "rentalPortal",
      icon: Home,
      label: "Dashboard",
      priority: 1,
    },
    {
      slug: "billing",
      icon: CreditCard,
      label: "Billing Statement",
      priority: 1,
    },
    {
      slug: "paymentHistory/currentLeasePayment",
      icon: ReceiptText,
      label: "Payment History",
      priority: 1,
    },
    {
      slug: "announcement",
      icon: Bell,
      label: "Announcements",
      priority: 2,
    },
    {
      slug: "maintenance",
      icon: Wrench,
      label: "Maintenance Request",
      priority: 2,
    },
    {
      slug: "exitPortal",
      icon: LogOut,
      label: "Exit Portal",
      priority: 3,
    },
  ].map(({ slug, priority, icon, label }) => {
    let href = `/pages/tenant/${slug}`;

    if (slug === "rentalPortal" && agreement_id) {
      href = `/pages/tenant/${slug}/${agreement_id}`;
    } else if (agreement_id && slug !== "exitPortal") {
      href = `/pages/tenant/${slug}?agreement_id=${agreement_id}`;
    } else if (slug === "exitPortal") {
      href = "/pages/tenant/my-unit";
    }

    return { href, priority, icon, label };
  });

  const primaryItems = menuItems.filter((item) => item.priority === 1);
  const secondaryItems = menuItems.filter((item) => item.priority === 2);
  const exitItem = menuItems.find((item) => item.priority === 3);

  const getIsActive = (href: string) => {
    const basePath = href.split("?")[0];
    return pathname.includes(basePath);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar - Fixed and Sticky (only if agreement_id exists) */}
      {agreement_id && (
        <div className="hidden md:block fixed left-0 top-0 w-64 bg-white shadow-lg h-full overflow-y-auto z-30">
          <div className="p-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-800 to-blue-600 bg-clip-text text-transparent">
              Tenant Portal
            </h1>
          </div>

          <nav className="px-4 pb-6">
            <ul className="space-y-1">
              {propertyInfo && (
                <div className="px-5 py-4 mb-4 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-md">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide line-clamp-2">
                    {propertyInfo.property_name}
                  </h2>
                  <p className="text-sm text-blue-50 mt-1 flex items-center gap-1">
                    <Home className="w-4 h-4 text-emerald-100 flex-shrink-0" />
                    Unit{" "}
                    <span className="font-semibold text-white">
                      {propertyInfo.unit_name}
                    </span>
                  </p>
                </div>
              )}
              {menuItems.map(({ href, icon: Icon, label }) => {
                const isExit = label === "Exit Portal";
                const isActive = getIsActive(href);

                return (
                  <li key={href} className="relative group">
                    <button
                      onClick={() => handleNavigation(href)}
                      className={`
                        flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200
                        ${
                          isExit
                            ? "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:opacity-90 active:scale-95"
                            : isActive
                            ? "bg-gradient-to-r from-green-50 to-blue-50 text-green-700 font-semibold shadow-sm"
                            : "hover:bg-gray-50 text-gray-700 active:bg-gray-100"
                        }
                      `}
                    >
                      {/* Active indicator bar */}
                      {!isExit && (
                        <span
                          className={`
                            absolute left-0 top-0 h-full w-1 rounded-r 
                            bg-gradient-to-b from-green-600 via-teal-500 to-blue-600
                            ${
                              isActive
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }
                            transition-opacity duration-300
                          `}
                        />
                      )}

                      {/* Icon */}
                      <Icon
                        className={`w-5 h-5 mr-3 flex-shrink-0 ${
                          isExit
                            ? "text-white"
                            : isActive
                            ? "text-green-700"
                            : "text-gray-500"
                        }`}
                      />

                      {/* Label */}
                      <span className="flex-1 text-left truncate">{label}</span>

                      {/* Active dot indicator */}
                      {isActive && !isExit && (
                        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-600 to-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}

      {/* Mobile Menu Button - Floating (only if agreement_id exists) */}
      {agreement_id && (
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={toggleMobileMenu}
            className={`
              p-4 rounded-full shadow-lg transition-all duration-300 transform active:scale-95
              ${
                isMobileMenuOpen
                  ? "bg-red-500 hover:bg-red-600 rotate-90"
                  : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:scale-110"
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
      )}

      {/* Mobile Menu - Bottom Sheet Style (only if agreement_id exists) */}
      {agreement_id && isMobileMenuOpen && (
        <>
          {/* Backdrop - No color, just clickable area */}
          <div
            className="md:hidden fixed inset-0 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
            role="presentation"
          />

          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] overflow-hidden flex flex-col transition-transform duration-300"
            onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientY)}
            onTouchEnd={(e) => {
              setTouchEnd(e.changedTouches[0].clientY);

              if (e.changedTouches[0].clientY - touchStart > 50) {
                setIsMobileMenuOpen(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold bg-gradient-to-r from-green-800 to-blue-600 bg-clip-text text-transparent">
                Tenant Portal
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Manage your rental experience
              </p>
            </div>

            <div className="overflow-y-auto flex-1">
              <nav className="p-4 space-y-4">
                {/* Essential Services - Primary Items */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-600 mb-3 px-2 uppercase tracking-wider">
                    Essential Services
                  </h3>
                  <div className="space-y-2">
                    {primaryItems.map(({ href, icon: Icon, label }) => {
                      const isActive = getIsActive(href);
                      return (
                        <button
                          key={href}
                          onClick={() => handleNavigation(href)}
                          className={`
                            flex items-center w-full p-4 rounded-xl transition-all duration-200 border-2 active:scale-95
                            ${
                              isActive
                                ? "bg-gradient-to-br from-green-50 to-blue-50 border-green-300 text-green-700 font-semibold shadow-sm"
                                : "bg-white border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                            }
                          `}
                        >
                          <div
                            className={`
                              p-3 rounded-lg mr-3 flex-shrink-0
                              ${
                                isActive
                                  ? "bg-gradient-to-r from-green-100 to-blue-100"
                                  : "bg-gray-100"
                              }
                            `}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                isActive ? "text-green-700" : "text-gray-600"
                              }`}
                            />
                          </div>
                          <span className="flex-1 text-left font-medium text-sm md:text-base">
                            {label}
                          </span>
                          <ChevronRight
                            className={`w-5 h-5 flex-shrink-0 ${
                              isActive ? "text-green-700" : "text-gray-400"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Communication & Support */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-600 mb-3 px-2 uppercase tracking-wider">
                    Communication & Support
                  </h3>
                  <div className="space-y-2">
                    {secondaryItems.map(({ href, icon: Icon, label }) => {
                      const isActive = getIsActive(href);
                      return (
                        <button
                          key={href}
                          onClick={() => handleNavigation(href)}
                          className={`
                            flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 active:scale-95
                            ${
                              isActive
                                ? "bg-gradient-to-r from-green-50 to-blue-50 text-green-700 font-semibold"
                                : "hover:bg-gray-50 text-gray-700"
                            }
                          `}
                        >
                          <Icon
                            className={`w-5 h-5 mr-3 flex-shrink-0 ${
                              isActive ? "text-green-700" : "text-gray-500"
                            }`}
                          />
                          <span className="flex-1 text-left font-medium text-sm">
                            {label}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 flex-shrink-0 ${
                              isActive ? "text-green-700" : "text-gray-400"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exit Portal */}
                {exitItem && (
                  <div className="border-t border-gray-100 pt-4">
                    <button
                      onClick={() => handleNavigation(exitItem.href)}
                      className="flex items-center w-full p-4 rounded-xl transition-all duration-200 bg-gradient-to-r from-red-500 to-rose-500 text-white hover:opacity-90 active:scale-95"
                    >
                      <div className="p-3 rounded-lg mr-3 bg-white/20 flex-shrink-0">
                        <exitItem.icon className="w-6 h-6" />
                      </div>
                      <span className="flex-1 text-left font-medium text-sm md:text-base">
                        {exitItem.label}
                      </span>
                      <ChevronRight className="w-5 h-5 flex-shrink-0" />
                    </button>
                  </div>
                )}

                <div className="h-4"></div>
              </nav>
            </div>
          </div>
        </>
      )}

      <div
        className={`flex-1 ${agreement_id ? "md:ml-64" : ""} overflow-y-auto`}
      >
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
};

export default TenantLayout;
