"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import axios from "axios";
import { useState, useEffect } from "react";
import {
  Home,
  Building2,
  FileText,
  CreditCard,
  BarChart3,
  ArrowLeft,
  SlidersHorizontal,
  Zap,
    Videotape,
  ScrollText,
  Menu,
  X,
  ChevronLeft,
  MapPin,
  MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users } from 'lucide-react';

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPropertyMenu, setShowPropertyMenu] = useState(false);

  const { data, error, isLoading } = useSWR(
    id ? `/api/propertyListing/getPropDetailsById?property_id=${id}` : null,
    fetcher
  );

  const property = data?.property;
  const propertyName = property?.property_name || "Loading...";
  const city = property?.city || "";
  const province = property?.province || "";

    const menu = [
        {
            id: "units",
            label: "Units",
            href: `/pages/landlord/properties/${id}`,
            icon: Home,
        },
        {
            id: "active-lease",
            label: "Active Lease",
            href: `/pages/landlord/properties/${id}/activeLease`,
            icon: ScrollText,
        },
        {
            id: "billing",
            label: "Billing",
            href: `/pages/landlord/properties/${id}/billing`,
            icon: CreditCard,
        },
        {
            id: "pdc-management",
            label: "PDC Management",
            href: `/pages/landlord/properties/${id}/pdcManagement`,
            icon: FileText,
        },
        {
            id: "Assets",
            label: "Assets",
            href: `/pages/landlord/properties/${id}/assets_management`,
            icon: Videotape,
        },
        {
            id: "Prospectives",
            label: "Prospectives",
            href: `/pages/landlord/properties/${id}/prospectives`,
            icon: Users,
        },
        {
            id: "documents",
            label: "Documents",
            href: `/pages/landlord/properties/${id}/documents`,
            icon: FileText,
        },
        {
            id: "Reports",
            label: "Reports",
            href: `/pages/landlord/properties/${id}/reports`,
            icon: BarChart3,
        },
        {
            id: "utilities",
            label: "Utilities",
            href: `/pages/landlord/properties/${id}/utilities`,
            icon: Zap,
        },
        {
            id: "configuration",
            label: "Configuration",
            href: `/pages/landlord/properties/${id}/configurations`,
            icon: SlidersHorizontal,
        },
    ];

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/pages/landlord/property-listing")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="flex-1 min-w-0 px-2">
            <h1 className="text-sm font-semibold text-gray-900 truncate">
              {isLoading ? "Loading..." : propertyName}
            </h1>
            {city && province && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {city}, {province}
              </p>
            )}
          </div>

          <button
            onClick={() => setShowPropertyMenu(!showPropertyMenu)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Mobile Tab Bar */}
        <div className="px-2 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {menu.slice(0, 4).map(({ id: menuId, label, href, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={menuId} // ✅ FIXED: Using unique ID instead of href
                  href={href}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  `}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </Link>
              );
            })}
            {menu.length > 4 && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium whitespace-nowrap hover:bg-gray-200"
              >
                More...
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop/Tablet Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen
          w-80 bg-white border-r border-gray-200 shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 z-40
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.push("/pages/landlord/property-listing")}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Properties
              </button>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Property Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-gray-900 truncate">
                    {isLoading ? (
                      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      propertyName
                    )}
                  </h1>
                  {city && province ? (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {city}, {province}
                    </p>
                  ) : isLoading ? (
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-1" />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
            <div className="space-y-1">
              {menu.map(
                ({ id: menuId, label, href, icon: Icon, description }) => {
                  const isActive =
                    pathname === href || pathname.startsWith(href + "/");
                  return (
                    <motion.div
                      key={menuId} // ✅ FIXED: Using unique ID instead of href
                      whileHover={{ x: 2 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    >
                      <Link
                        href={href}
                        className={`
                        block px-4 py-3 rounded-lg transition-all duration-200 group
                        ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                            : "hover:bg-gray-50 text-gray-700"
                        }
                      `}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-5 h-5 ${
                              !isActive && "group-hover:text-blue-600"
                            }`}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{label}</p>
                            <p
                              className={`text-xs mt-0.5 ${
                                isActive ? "text-white/80" : "text-gray-500"
                              }`}
                            >
                              {description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                }
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} UpKyp
              </p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-h-screen lg:pt-0">
        <div className="p-4 lg:p-6">{children}</div>
      </main>

      {/* Mobile Property Menu */}
      <AnimatePresence>
        {showPropertyMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-4 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[200px]"
          >
            {menu.slice(4).map(({ id: menuId, label, href, icon: Icon }) => (
              <Link
                key={menuId} // ✅ FIXED: Using unique ID instead of href
                href={href}
                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
