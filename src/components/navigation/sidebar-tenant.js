"use client";
import { useState } from "react";
import {router, usePathname, useRouter} from "next/navigation";
import { Home, Bell, MessageCircle, Wrench, CreditCard, Menu, X, ReceiptText } from "lucide-react";
import Swal from "sweetalert2";

const menuItems = [
  { href: "/pages/tenant/dashboard", icon: Home, label: "Dashboard" },
  { href: "/pages/tenant/announcement", icon: Bell, label: "Announcements" },
  { href: "/pages/tenant/chat", icon: MessageCircle, label: "Chats" },
  { href: "/pages/tenant/paymentHistory/currentLeasePayment", icon: ReceiptText, label: "Payment History" },
  {
    href: "/pages/tenant/maintenance",
    icon: Wrench,
    label: "Maintenance Request",
  },
  { href: "/pages/tenant/billing", icon: CreditCard, label: "Billing Payment" },
];


const handleNavigation = (href) => {
  Swal.fire({
    title: "Loading...",
    text: "Redirecting to " + href,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  setTimeout(() => {
    router.push(href);
    Swal.close();
  }, 1000);
};

const TenantLayout = ({ children }) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavigation = (href) => {
    Swal.fire({
      title: "Loading...",
      text: "Redirecting to " + href,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    setTimeout(() => {
      router.push(href);
      Swal.close();
    }, 1000);
  };



  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="md:hidden p-4 bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-900">Rent Management</h1>
        <button 
          onClick={toggleMobileMenu} 
          className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div 
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-white shadow-lg md:min-h-screen`}
      >
        <div className="hidden md:block p-6">
          <h1 className="text-xl font-bold text-blue-900">Rent Management</h1>
        </div>

        <nav className="px-4 py-2 md:py-0">
          <ul className="space-y-2">
            {menuItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                  <li key={href}>
                    <button
                        onClick={() => handleNavigation(href)}
                        className={`
                      flex items-center w-full px-4 py-3 rounded-lg text-gray-700 transition-all duration-200
                      ${isActive ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-gray-100"}
                    `}
                    >
                      <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-blue-700" : "text-gray-500"}`}/>
                      <span>{label}</span>
                      {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-blue-600"></span>}
                    </button>
                  </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
};

export default TenantLayout;