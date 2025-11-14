"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Bell,
  Wrench,
  CreditCard,
  ReceiptText,
  LogOut,
} from "lucide-react";
import axios from "axios";

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
  const agreement_id = params.agreement_id;

  const pathname = usePathname();
  const router = useRouter();
  const [propertyInfo, setPropertyInfo] = useState<PropertyInfo | null>(null);

  /* ================== FETCH PROPERTY INFO ================== */
  useEffect(() => {
    if (!agreement_id) return;
    const fetchPropertyUnitInfo = async () => {
      try {
        const res = await axios.get(`/api/tenant/activeRent/propertyUnitInfo`, {
          params: { agreement_id },
        });
        setPropertyInfo(res.data);
      } catch (err) {
        console.error("Failed to fetch property info:", err);
      }
    };
    fetchPropertyUnitInfo();
  }, [agreement_id]);

  /* ================== MENU ITEMS ================== */
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
  let href = "";

  if (slug === "rentalPortal") {
    href = `/pages/tenant/rentalPortal/${agreement_id}`;
  }
  // EXIT
  else if (slug === "exitPortal") {
    href = "/pages/tenant/my-unit";
  }
  else {
    href = `/pages/tenant/rentalPortal/${agreement_id}/${slug}?agreement_id=${agreement_id}`;
  }

  return { href, priority, icon, label };
});


  const getIsActive = (href: string) => {
    const base = href.split("?")[0];
    return pathname.includes(base);
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ================== DESKTOP SIDEBAR ================== */}
      <aside className="hidden md:block fixed left-0 top-0 w-64 bg-white shadow-lg h-full overflow-y-auto z-30">

        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-800 to-emerald-600 bg-clip-text text-transparent">
            Tenant Portal
          </h1>
        </div>

        <nav className="px-4 pb-6">
          <ul className="space-y-1">

            {propertyInfo && (
              <div className="px-5 py-4 mb-4 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl shadow-md">
                <h2 className="text-lg sm:text-xl font-bold text-white line-clamp-2">
                  {propertyInfo.property_name}
                </h2>
                <p className="text-sm text-blue-50 mt-1 flex items-center gap-1">
                  <Home className="w-4 h-4 text-blue-100" />
                  Unit{" "}
                  <span className="font-semibold text-white">
                    {propertyInfo.unit_name}
                  </span>
                </p>
              </div>
            )}

            {menuItems.map(({ href, label, icon: Icon }) => {
              const active = getIsActive(href);
              const isExit = label === "Exit Portal";

              return (
                <li key={href} className="relative group">
                  <button
                    onClick={() => router.push(href)}
                    className={`
                      flex items-center w-full px-4 py-3 rounded-xl transition-all
                      ${
                        isExit
                          ? "bg-gradient-to-r from-red-500 to-rose-500 text-white"
                          : active
                          ? "bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-700 shadow-sm"
                          : "hover:bg-gray-50 text-gray-700"
                      }
                    `}
                  >
                    <Icon
                      className={`
                        w-5 h-5 mr-3
                        ${
                          isExit
                            ? "text-white"
                            : active
                            ? "text-blue-700"
                            : "text-gray-500"
                        }
                      `}
                    />
                    <span className="flex-1 text-left">{label}</span>

                    {!isExit && active && (
                      <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* ================== MAIN CONTENT ================== */}
      <main className="flex-1 md:ml-64 pl-4 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
