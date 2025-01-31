import React from 'react';
import Link from 'next/link';

const Sidebar = () => {
    return (
<div className="w-64 bg-white shadow-md text-blue-900">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Rent Management System</h1>
        </div>
        <nav className="mt-8 space-y-4">
          <a href="#" className="block px-6 py-2 text-blue-900">
            Dashboard
          </a>
          <a href="#" className="block px-6 py-2 bg-blue-600 text-white">
            Property Listing
          </a>
          <a href="#" className="block px-6 py-2 text-blue-900">
            Property Visit Schedule
          </a>
          <a href="#" className="block px-6 py-2 text-blue-900">
            Maintenance Request
          </a>
          <a href="#" className="block px-6 py-2 text-blue-900">
            Announcement
          </a>
          <a href="#" className="block px-6 py-2 text-blue-900">
            Property Billing System
          </a>
        </nav>
      </div> )
}

export default Sidebar;