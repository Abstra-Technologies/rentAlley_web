"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon,
  BellIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ArrowLeftOnRectangleIcon,
  BuildingOfficeIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { LogOut } from 'lucide-react';

interface PropertyInfo {
  property_name: string;
  unit_name: string;
}

export default function TenantPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { agreement_id: string };
}) {
  const agreement_id = params?.agreement_id ?? null;
  const pathname = usePathname();
  const router = useRouter();
  const [propertyInfo, setPropertyInfo] = useState<PropertyInfo | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ================== FETCH PROPERTY INFO ================== */
  useEffect(() => {
    let mounted = true;

    const fetchPropertyUnitInfo = async () => {
      try {
        const res = await axios.get(`/api/tenant/activeRent/propertyUnitInfo`, {
          params: { agreement_id },
        });
        if (mounted) setPropertyInfo(res.data || null);
      } catch (err) {
        console.error("Failed to fetch property info:", err);
      }
    };

    fetchPropertyUnitInfo();

    return () => {
      mounted = false;
    };
  }, [agreement_id]);

  /* ================== MENU ITEMS ================== */
  const menuItems = [
    { slug: "rentalPortal", icon: HomeIcon, label: "Dashboard" },
    { slug: "billing", icon: CreditCardIcon, label: "Billing Statement" },
    {
      slug: "paymentHistory",
      icon: DocumentTextIcon,
      label: "Payment History",
    },
    { slug: "announcement", icon: BellIcon, label: "Announcements" },
    { slug: "maintenance", icon: WrenchScrewdriverIcon, label: "Maintenance" },
      { slug: "exit", icon: LogOut, label: "Exit Portal" },

  ].map(({ slug, icon, label }) => {
    let href = "";

    if (slug === "rentalPortal") {
      href = `/pages/tenant/rentalPortal/${agreement_id}`;
    }
    else if (slug === "exit") {
        href = `/pages/tenant/my-unit`;
    }
    else {
      href = `/pages/tenant/rentalPortal/${agreement_id}/${slug}`;
    }

    return { href, icon, label, slug };
  });

  // Fixed active state logic - exact matching
  const getIsActive = (href: string, slug: string) => {
    // For dashboard, check exact match
    if (slug === "rentalPortal") {
      return pathname === href || pathname === `${href}/`;
    }
    // For other pages, check if pathname starts with the href
    return pathname.startsWith(href);
  };

  if (!agreement_id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-sm">Loading portal...</p>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          Upkyp Portal
        </h1>
        <p className="text-xs text-gray-500 mt-1">Tenant Dashboard</p>
      </div>

      {/* Property Info Card */}
      {propertyInfo && (
        <div className="p-4 border-b border-gray-200">
          <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <BuildingOfficeIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">
                  {propertyInfo.property_name}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Unit{" "}
                  <span className="font-semibold">
                    {propertyInfo.unit_name}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {menuItems.map(({ href, label, icon: Icon, slug }) => {
            const active = getIsActive(href, slug);

            return (
              <li key={href}>
                <button
                  onClick={() => {
                    router.push(href);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    flex items-center w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                    ${
                      active
                        ? "bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 mr-3 ${
                      active ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  <span className="flex-1 text-left">{label}</span>
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Exit Button at Bottom */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            router.push("/pages/tenant/my-unit");
            setMobileMenuOpen(false);
          }}
          className="flex items-center w-full px-3 py-2.5 rounded-lg transition-all text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 group"
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-600" />
          <span className="flex-1 text-left">Exit Portal</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow"
        aria-label="Open menu"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="fixed left-0 top-0 w-72 bg-white h-full shadow-xl flex flex-col pt-14"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button - Top Right Corner */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>

            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex min-h-screen bg-gray-50">
        {/* Desktop SIDEBAR - Below Navbar */}
        <aside className="hidden md:flex md:flex-col fixed left-0 top-16 w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] z-20">
          <SidebarContent />
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 md:ml-64 overflow-y-auto">{children}</main>
      </div>
    </>
  );
}
