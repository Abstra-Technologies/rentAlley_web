"use client";
import Link from "next/link";
import { Home, Bell, Wrench, CreditCard, Building } from "lucide-react";

const menuItems = [
  { href: "/pages/tenant/dashboard", icon: Home, label: "Dashboard" },
  { href: "/pages/tenant/announcement", icon: Bell, label: "Announcements" },
  {
    href: "/pages/tenant/maintenance",
    icon: Wrench,
    label: "Maintenance Request",
  },
  { href: "/pages/tenant/billing", icon: CreditCard, label: "Billing Payment" },
  { href: "/pages/tenant/my-unit", icon: Building, label: "My Unit" }, // New My Units menu item
];

const TenantLayout = ({ children }) => {
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
            {menuItems.map(({ href, icon: Icon, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
};

export default TenantLayout;
