'use client'
import Link from 'next/link';
import { Home, Building, Calendar, Wrench, Bell, CreditCard } from 'lucide-react';

const menuItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/property-listing', icon: Building, label: 'Property Listing' },
  { href: '/visit-schedule', icon: Calendar, label: 'Visit Schedule' },
  { href: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/announcements', icon: Bell, label: 'Announcements' },
  { href: '/billing', icon: CreditCard, label: 'Billing' }
];

const LandlordLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        {/* Title Section */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-blue-900">Rent Management</h1>
          <h2 className="text-lg text-blue-800">System</h2>
        </div>

        {/* Navigation Links */}
        <nav className="px-4 py-4">
          <ul className="space-y-2">
            {menuItems.map(({ href, icon: Icon, label }) => (
              <li key={href}>
                <Link 
                  href={href}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
};

export default LandlordLayout;
