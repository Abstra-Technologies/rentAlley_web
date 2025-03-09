"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Building,
  Calendar,
  Wrench,
  Bell,
  CreditCard,
  Bug,
  MessageSquareMore,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const menuItems = [
  { href: "/pages/landlord/dashboard", icon: Home, label: "Dashboard" },
  {
    href: "/pages/landlord/property-listing",
    icon: Building,
    label: "Property Listing",
  },
  {
    href: "/pages/landlord/booking-appointment",
    icon: Calendar,
    label: "Visit Schedule",
  },
  {
    href: "/pages/landlord/list_of_tenants",
    icon: Calendar,
    label: "My Tenants",
  },
  { href: "/pages/landlord/chat", icon: MessageSquareMore, label: "Chats" },
  {
    href: "/pages/landlord/maintenance-request",
    icon: Wrench,
    label: "Maintenance",
  },
  { href: "/pages/landlord/announcement", icon: Bell, label: "Announcements" },
  { href: "/pages/landlord/billing", icon: CreditCard, label: "Billing" },
  { href: "/pages/commons/bug-report", icon: Bug, label: "Report a Bug" },
];

const LandlordLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Mobile Menu Button */}
      <div className="md:hidden p-4 bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-900">Rent Management</h1>
        <button 
          onClick={toggleMobileMenu} 
          className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - hidden on mobile unless toggled */}
      <div 
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white shadow-lg md:min-h-screen`}
      >
        {/* Logo and Title - hidden on mobile */}
        <div className="hidden md:block p-6">
          <h1 className="text-xl font-bold text-blue-900">Rent Management</h1>
        </div>

        {/* Navigation Links */}
        <nav className="px-4 py-2 md:py-0">
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
                    onClick={() => setIsMobileMenuOpen(false)}
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
      <div className="flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
};

export default LandlordLayout;