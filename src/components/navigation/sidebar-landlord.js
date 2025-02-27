'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building, Calendar, Wrench, Bell, CreditCard, Bug, MessageSquareMore, Menu, X, LogOut } from 'lucide-react';
import useAuth from "../../../hooks/useSession";

const menuItems = [
  { href: '/pages/landlord/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/pages/landlord/property-listing', icon: Building, label: 'Property Listing' },
  { href: '/visit-schedule', icon: Calendar, label: 'Visit Schedule' },
  { href: '/pages/commons/chat', icon: MessageSquareMore, label: 'Chats' },
  { href: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { href: '/announcements', icon: Bell, label: 'Announcements' },
  { href: '/billing', icon: CreditCard, label: 'Billing' },
  { href: '/pages/commons/bug-report', icon: Bug, label: 'Report a Bug' }
];

const LandlordLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const {user} = useAuth();
  
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (sidebarOpen && !event.target.closest('aside') && !event.target.closest('button')) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [sidebarOpen]);
  
  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="mr-3 p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-blue-900">Rent Management</h1>
            <h2 className="text-xs text-blue-800/70">System</h2>
          </div>
        </div>
        
        {/* User profile - Mobile */}
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
            LN
          </div>
        </div>
      </header>

      {/* Sidebar - Desktop (permanent) and Mobile (slideover) */}
      <aside 
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
          transition-all duration-300 ease-in-out
          fixed md:sticky top-0 left-0 z-40
          w-72 md:w-64 bg-white
          flex flex-col
          h-full md:min-h-screen
          md:border-r border-gray-200
          shadow-xl md:shadow-none
        `}
      >
        {/* Logo section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            {/* Logo placeholder */}
            <div className="flex-shrink-0 mr-3">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">RM</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">Rent Management</h1>
              <h2 className="text-sm text-blue-800/70">System</h2>
            </div>
            
            {/* Close button for mobile */}
            <button 
              onClick={toggleSidebar}
              className="md:hidden ml-auto p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User profile section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              LN
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">{user.firstName}</h3>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-grow overflow-y-auto py-6 px-3">
          <div className="space-y-1">
            {menuItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                  <span>{label}</span>
                  {isActive && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-blue-600"></span>
                  )}
                </Link>
              );
            })}
          </div>
          
          {/* Settings section */}
          <div className="mt-10 pt-6 border-t border-gray-200">
            <h4 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Settings
            </h4>
            <div className="mt-3 space-y-1">
              <Link
                href="/settings/profile"
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                <span>Account Settings</span>
              </Link>
              <button
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
              >
                <LogOut className="w-5 h-5 mr-3 text-red-500" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default LandlordLayout;