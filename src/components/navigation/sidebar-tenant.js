"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Bell, Wrench, CreditCard, Building } from "lucide-react";

const menuItems = [
  { href: "/pages/tenant/dashboard", icon: Home, label: "Dashboard" },
  { href: "/pages/tenant/announcement", icon: Bell, label: "Announcements" },
  { href: "/pages/tenant/chat", icon: Bell, label: "Chats" },

  {
    href: "/pages/tenant/maintenance",
    icon: Wrench,
    label: "Maintenance Request",
  },
  { href: "/pages/tenant/billing", icon: CreditCard, label: "Billing Payment" },
];

const TenantLayout = ({ children }) => {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        {/* Logo and Title */}
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-900">Rent Management</h1>
        </div>

        {/* Navigation Links */}
        <nav className="px-4">
          <ul className="space-y-2">
            {menuItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`
                      flex items-center px-4 py-3 rounded-lg text-gray-700 transition-all duration-200
                      ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "hover:bg-gray-100"
                      }
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 mr-3 ${
                        isActive ? "text-blue-700" : "text-gray-500"
                      }`}
                    />
                    <span>{label}</span>
                    {isActive && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-blue-600"></span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
};

export default TenantLayout;
