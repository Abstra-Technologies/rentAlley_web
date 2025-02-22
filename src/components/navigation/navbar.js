"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { CiBellOn } from "react-icons/ci";
import useAuth from "../../../hooks/useSession";

const Navbar = () => {
    const { user, admin, loading, signOut, signOutAdmin } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // Dummy function to fetch notifications - replace with actual implementation
    useEffect(() => {
        if (user || admin) {
            // Example notifications - replace with actual API call
            setNotifications([
                { id: 1, title: "New message", body: "You have a new message from your landlord" },
                { id: 2, title: "Payment reminder", body: "Your renter's due date is today." }
            ]);
        }
    }, [user, admin]);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
        if (notifOpen) setNotifOpen(false);
    };
    const toggleNotifications = () => {
        setNotifOpen(!notifOpen);
        if (dropdownOpen) setDropdownOpen(false);
    };

    const handleLogout = async () => {
        if (admin) {
            await signOutAdmin();
        } else {
            await signOut();
        }
        setDropdownOpen(false);
    };

    // Function to determine navigation links based on user type
    const getNavigationLinks = () => {
        if (admin) {
            return [
                { href: "/pages/system_admin/dashboard", label: "Dashboard" },
            ];
        }

        if (!user) {
            return [
                { href: "/about", label: "About Us" },
                { href: "/partner", label: "Partner" },
                { href: "/contact", label: "Contact Us" }
            ];
        }
        
        if (user.userType === "tenant") {
            return [
                { href: "/pages/tenant/my-unit", label: "My Unit" },
                { href: "/pages/tenant/inbox", label: "Inbox" },
                { href: "/pages/tenant/find-rent", label: "Find Rent" },
                { href: "/contact", label: "Contact Us" }
            ];
        }
        
        if (user.userType === "landlord") {
            return [
                { href: "/pages/landlord/inbox", label: "Inbox" },
                { href: "/pages/landlord/dashboard", label: "Dashboard" }
            ];
        }

        return [];
    };

    const navigationLinks = getNavigationLinks();

    return (
        <nav className="bg-blue-600 text-white shadow-md rounded-b-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-bold">
                        Rentahan
                    </Link>

                    <div className="hidden md:flex space-x-6 ml-auto mr-6">
                        {navigationLinks.map((link) => (
                            <Link 
                                key={link.href} 
                                href={link.href} 
                                className="hover:text-gray-300"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Authentication Section */}
                    {loading ? (
                        <p>Loading...</p>
                    ) : !user && !admin ? (
                        <div className="hidden md:flex space-x-4">
                            <Link
                                href="/pages/auth/login"
                                className="px-4 py-2 bg-gray-100 text-blue-600 rounded-md font-medium hover:bg-gray-200"
                            >
                                Login
                            </Link>
                            <Link
                                href="/pages/auth/selectRole"
                                className="px-4 py-2 bg-blue-500 rounded-md font-medium hover:bg-blue-700"
                            >
                                Register
                            </Link>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center space-x-4">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button 
                                    onClick={toggleNotifications} 
                                    className="relative focus:outline-none p-1 hover:bg-blue-700 rounded-full"
                                    aria-label="Notifications"
                                >
                                    <CiBellOn className="w-6 h-6" />
                                    {notifications.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                            {notifications.length}
                                        </span>
                                    )}
                                </button>
                                
                                {notifOpen && (
                                    <div className="absolute right-0 mt-2 w-72 bg-white text-black rounded-md shadow-lg py-2 z-10">
                                        <div className="flex justify-between items-center border-b px-4 pb-2">
                                            <h3 className="text-gray-800 font-bold">Notifications</h3>
                                            {notifications.length > 0 && (
                                                <button 
                                                    className="text-xs text-blue-600 hover:text-blue-800"
                                                    onClick={() => setNotifications([])}
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <p className="px-4 py-3 text-gray-600 text-center">No new notifications</p>
                                            ) : (
                                                notifications.map((notif) => (
                                                    <div key={notif.id} className="border-b hover:bg-gray-50 cursor-pointer">
                                                        <div className="px-4 py-3">
                                                            <p className="font-semibold text-gray-800">{notif.title}</p>
                                                            <p className="text-sm text-gray-600 mt-1">{notif.body}</p>
                                                            <p className="text-xs text-gray-400 mt-1">Just now</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        
                                        {notifications.length > 0 && (
                                            <div className="px-4 pt-2 border-t">
                                                <Link 
                                                    href="/notifications" 
                                                    className="text-sm text-blue-600 hover:text-blue-800 block text-center"
                                                >
                                                    View all notifications
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button onClick={toggleDropdown} className="focus:outline-none">
                                    <Image
                                        src={user?.profilePicture || admin?.profile_picture || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"}
                                        alt="Profile"
                                        width={40}
                                        height={40}
                                        className="w-8 h-8 object-cover rounded-full"
                                    />
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute right-0 top-11 w-48 bg-white text-black rounded-md shadow-lg py-2 z-10 flex flex-col">
                                        <Link 
                                            href={`/pages/${user?.userType || 'system_admin'}/dashboard`} 
                                            className="block px-4 py-2 hover:bg-gray-200"
                                        >
                                            Dashboard
                                        </Link>
                                        
                                        {user && (
                                            <Link
                                                href={`/pages/${user.userType}/profile/${user.user_id}`}
                                                className="block px-4 py-2 hover:bg-gray-200"
                                            >
                                                View Profile
                                            </Link>
                                        )}
                                        
                                        {admin && (
                                            <Link
                                                href={`/pages/system_admin/profile/${admin.admin_id}`}
                                                className="block px-4 py-2 hover:bg-gray-200"
                                            >
                                                View Profile
                                            </Link>
                                        )}
                                        
                                        <Link href="/settings" className="block px-4 py-2 hover:bg-gray-200">
                                            Settings
                                        </Link>
                                        <button 
                                            onClick={handleLogout} 
                                            className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center space-x-2">
                        {/* Mobile Notification Bell */}
                        {(user || admin) && (
                            <div className="relative">
                                <button 
                                    onClick={toggleNotifications} 
                                    className="relative focus:outline-none p-1"
                                    aria-label="Notifications"
                                >
                                    <CiBellOn className="w-6 h-6" />
                                    {notifications.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                            {notifications.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}
                        
                        <button onClick={toggleMenu} className="text-white hover:text-gray-300 focus:outline-none">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden bg-blue-500 px-4 py-3 space-y-2 flex flex-col">
                    {navigationLinks.map((link) => (
                        <Link 
                            key={link.href} 
                            href={link.href} 
                            className="block hover:text-gray-300"
                        >
                            {link.label}
                        </Link>
                    ))}
                    {!user && !admin ? (
                        <>
                            <Link href="/pages/auth/login" className="block hover:text-gray-300">
                                Login
                            </Link>
                            <Link href="/pages/auth/selectRole" className="block hover:text-gray-300">
                                Register
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link 
                                href={`/pages/${user?.userType || 'system_admin'}/dashboard`}
                                className="block hover:text-gray-300"
                            >
                                Dashboard
                            </Link>
                            
                            {user && (
                                <Link
                                    href={`/pages/${user.userType}/profile/${user.user_id}`}
                                    className="block hover:text-gray-300"
                                >
                                    View Profile
                                </Link>
                            )}
                            
                            {admin && (
                                <Link
                                    href={`/pages/system_admin/profile/${admin.admin_id}`}
                                    className="block hover:text-gray-300"
                                >
                                    View Profile
                                </Link>
                            )}
                            
                            <Link href="/settings" className="block hover:text-gray-300">
                                Settings
                            </Link>
                            <button 
                                onClick={handleLogout}
                                className="block w-full text-left hover:text-gray-300"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            )}
            
            {/* Mobile Notifications Panel */}
            {notifOpen && (
                <div className="md:hidden bg-white text-black px-4 py-2 shadow-lg absolute w-full z-20">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-gray-800 font-bold">Notifications</h3>
                        {notifications.length > 0 && (
                            <button 
                                className="text-xs text-blue-600 hover:text-blue-800"
                                onClick={() => setNotifications([])}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="py-3 text-gray-600 text-center">No new notifications</p>
                        ) : (
                            notifications.map((notif) => (
                                <div key={notif.id} className="border-b hover:bg-gray-50 cursor-pointer">
                                    <div className="py-3">
                                        <p className="font-semibold text-gray-800">{notif.title}</p>
                                        <p className="text-sm text-gray-600 mt-1">{notif.body}</p>
                                        <p className="text-xs text-gray-400 mt-1">Just now</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {notifications.length > 0 && (
                        <div className="pt-2 border-t">
                            <Link 
                                href="/notifications" 
                                className="text-sm text-blue-600 hover:text-blue-800 block text-center"
                            >
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;