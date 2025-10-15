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
  LogOut
} from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";

interface TenantLayoutProps {
  children: React.ReactNode;
  agreement_id?: string | number;
}

const TenantLayout = ({ children, agreement_id }: TenantLayoutProps) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [propertyInfo, setPropertyInfo] = useState<{ property_name: string; unit_name: string } | null>(null);

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

  const handleNavigation = (label: string, href: string) => {
    // Close mobile menu immediately for better UX
    setIsMobileMenuOpen(false);

    Swal.fire({
      title: "Loading...",
      text: `Redirecting to ${label}`,
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
    // 🆕 Exit Portal Button (manual navigation)
    {
      slug: "exitPortal",
      icon: LogOut,
      label: "Exit Portal",
      priority: 3,
      onClick: () => router.replace("/pages/tenant/my-unit"),
    },
  ].map(({ slug, priority, icon, label, onClick }) => {
    let href = `/pages/tenant/${slug}`;

    if (slug === "rentalPortal" && agreement_id) {
      href = `/pages/tenant/${slug}/${agreement_id}`;
    } else if (agreement_id && slug !== "exitPortal") {
      href = `/pages/tenant/${slug}?agreement_id=${agreement_id}`;
    }

    return { href, priority, icon, label, onClick };
  });
  // Group menu items for mobile
  const primaryItems = menuItems.filter((item) => item.priority === 1);
  const secondaryItems = menuItems.filter((item) => item.priority === 2);

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
                  <div className="px-5 py-4 mb-4 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-md  user-select:none">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                      {propertyInfo.property_name}
                    </h2>
                    <p className="text-sm text-blue-50 mt-1 flex items-center gap-1">
                      <Home className="w-4 h-4 text-emerald-100" />
                      Unit <span className="font-semibold text-white">{propertyInfo.unit_name}</span>
                    </p>
                  </div>
              )}
              {menuItems.map(({ href, icon: Icon, label, onClick }) => {
                const isExit = label === "Exit Portal";
                const isActive = pathname.includes(href.split("?")[0]);

                return (
                    <li key={href} className="relative group">
                      <button
                          onClick={() =>
                              onClick ? onClick() : handleNavigation(label, href)
                          }
                          className={`
          flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200
          ${
                              isExit
                                  ? "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:opacity-90"
                                  : isActive
                                      ? "bg-gradient-to-r from-green-50 to-blue-50 text-green-700 font-semibold shadow-sm"
                                      : "hover:bg-gray-50 text-gray-700"
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
                            className={`w-5 h-5 mr-3 ${
                                isExit
                                    ? "text-white"
                                    : isActive
                                        ? "text-green-700"
                                        : "text-gray-500"
                            }`}
                        />

                        {/* Label */}
                        <span className="flex-1 text-left">{label}</span>

                        {/* Active dot indicator */}
                        {isActive && !isExit && (
                            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-600 to-blue-600" />
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
              p-4 rounded-full shadow-lg transition-all duration-300 transform
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
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40"
            onClick={toggleMobileMenu}
          />

          {/* Bottom Sheet Menu */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden">
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

            {/* Navigation - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(70vh-100px)]">
              <nav className="p-4">
                {/* Essential Services - Primary Items in Grid */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 px-2">
                    Essential Services
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {primaryItems.map(({ href, icon: Icon, label }) => {
                      const isActive = pathname.includes(href.split("?")[0]);
                      return (
                        <button
                          key={href}
                          onClick={() => handleNavigation(label, href)}
                          className={`
                            flex items-center p-4 rounded-2xl transition-all duration-200 border-2
                            ${
                              isActive
                                ? "bg-gradient-to-br from-green-50 to-blue-50 border-green-200 text-green-700"
                                : "bg-white border-gray-100 hover:border-gray-200 text-gray-700 hover:shadow-md"
                            }
                          `}
                        >
                          <div
                            className={`
                            p-3 rounded-xl mr-4
                            ${
                              isActive
                                ? "bg-gradient-to-r from-green-100 to-blue-100"
                                : "bg-gray-50"
                            }
                          `}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                isActive ? "text-green-700" : "text-gray-500"
                              }`}
                            />
                          </div>
                          <span className="flex-1 text-left font-medium">
                            {label}
                          </span>
                          <ChevronRight
                            className={`w-5 h-5 ${
                              isActive ? "text-green-700" : "text-gray-400"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Communication & Support - List Style */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 px-2">
                    Communication & Support
                  </h3>
                  <div className="space-y-2">
                    {secondaryItems.map(({ href, icon: Icon, label }) => {
                      const isActive = pathname.includes(href.split("?")[0]);
                      return (
                        <button
                          key={href}
                          onClick={() => handleNavigation(label, href)}
                          className={`
                            flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200
                            ${
                              isActive
                                ? "bg-gradient-to-r from-green-50 to-blue-50 text-green-700"
                                : "hover:bg-gray-50 text-gray-700"
                            }
                          `}
                        >
                          <Icon
                            className={`w-5 h-5 mr-3 ${
                              isActive ? "text-green-700" : "text-gray-500"
                            }`}
                          />
                          <span className="flex-1 text-left font-medium">
                            {label}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 ${
                              isActive ? "text-green-700" : "text-gray-400"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Padding for Safe Area */}
                <div className="h-6"></div>
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Main Content - Adjusted margin for fixed sidebar */}
      <div
        className={`flex-1 ${agreement_id ? "md:ml-64" : ""} overflow-y-auto`}
      >
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
};

export default TenantLayout;
