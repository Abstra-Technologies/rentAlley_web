import React, { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import Link from 'next/link';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOutsideClick = (event) => {
    if (!event.target.closest('.sidebar')) {
        setIsOpen(false);
    }
};
    return (
<div className="relative" onClick={handleOutsideClick}>
            {/* Mobile Menu Button */}
            <button 
                className="md:hidden p-4 text-blue-900" 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
            >
                {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
            
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform w-64 bg-white shadow-md text-blue-900 md:relative md:block md:h-screen sidebar`}>
                <div className="p-6">
                    <h1 className="text-2xl font-bold">Rent Management System</h1>
                </div>
                <nav className="mt-8 space-y-4">
                    <a href="#" className="block px-6 py-2 text-blue-900">Dashboard</a>
                    <a href="#" className="block px-6 py-2 bg-blue-600 text-white">Property Listing</a>
                    <a href="#" className="block px-6 py-2 text-blue-900">Property Visit Schedule</a>
                    <a href="#" className="block px-6 py-2 text-blue-900">Maintenance Request</a>
                    <a href="#" className="block px-6 py-2 text-blue-900">Announcement</a>
                    <a href="#" className="block px-6 py-2 text-blue-900">Property Billing System</a>
                    <Link href="#" className="block px-6 py-2 text-blue-900">Report a Bug</Link>

                </nav>
            </div>
</div>)
}

export default Sidebar;