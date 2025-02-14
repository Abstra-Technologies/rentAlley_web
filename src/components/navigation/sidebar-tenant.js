'use client'
import Link from 'next/link';

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
            <li>
              <Link 
                href="/dashboard"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <svg 
                  className="w-5 h-5 mr-3" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/maintenance"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <svg 
                  className="w-5 h-5 mr-3" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
                <span>Maintenance Request</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/billing"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <svg 
                  className="w-5 h-5 mr-3" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <span>Billing Payment</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
};

export default TenantLayout;