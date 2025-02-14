"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useAuth from "../../../hooks/useSession";

const Navbar = () => {
    const { user, admin, loading, signOut, signOutAdmin } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    const handleLogout = async () => {
        if (admin) {
            await signOutAdmin();
        } else {
            await signOut();
        }
        setDropdownOpen(false);
    };

    return (
        <nav className="bg-blue-600 text-white shadow-md rounded-b-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-bold">
                        Rentahan
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-6">
                        <Link href="/about" className="hover:text-gray-300">About Us</Link>
                        <Link href="/partner" className="hover:text-gray-300">Partner</Link>
                        <Link href="/contact" className="hover:text-gray-300">Contact Us</Link>
                    </div>

                    {/* Authentication Section */}
                    {loading ? (
                        <p>loading...</p>
                    ) : !user && !admin ? (
                        <div className="hidden md:flex space-x-4">
                            <Link href="/pages/auth/login" className="px-4 py-2 bg-gray-100 text-blue-600 rounded-md font-medium hover:bg-gray-200">
                                Login
                            </Link>
                            <Link href="/pages/auth/selectRole" className="px-4 py-2 bg-blue-500 rounded-md font-medium hover:bg-blue-700">
                                Register
                            </Link>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center relative">
                            <button onClick={toggleDropdown} className="focus:outline-none">
                                <Image
                                    src={user?.profilePicture || admin?.profilePicture || "/profile-placeholder.png"}
                                    alt="Profile"
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                />
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 top-11 w-48 bg-white text-black rounded-md shadow-lg py-2 z-10 flex flex-col">
                                    <Link href={`/pages/${user?.userType}/profile/${user?.user_id || admin?.admin_id}`} className="block px-4 py-2 hover:bg-gray-200">
                                        View Profile
                                    </Link>
                                    <Link href="/settings" className="block px-4 py-2 hover:bg-gray-200">Settings</Link>
                                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-200">
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={toggleMenu} className="text-white hover:text-gray-300 focus:outline-none">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
