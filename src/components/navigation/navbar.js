'use client'
import { useState } from "react";
import Link from "next/link";
<<<<<<< Updated upstream
import Image from "next/image";
import useAuth from "../../../hooks/useSession"; // Updated import

const Navbar = () => {
    const { user, signOut } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    // const [profilePicture] = useState("");
    const toggleMenu = () => setMenuOpen(!menuOpen);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    const renderLinks = () => (
        <>
            <Link href="/about" className="hover:text-gray-300">
                About Us
            </Link>
            <Link href="/partner" className="hover:text-gray-300">
                Partner
            </Link>
            <Link href="/contact" className="hover:text-gray-300">
                Contact Us
            </Link>
        </>
    );

    return (
        <nav className="bg-blue-600 text-white shadow-md rounded-b-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="text-2xl font-bold">
                        Rentahan
                    </Link>

                    <div className="hidden md:flex space-x-6">
                        <Link href="/about" className="hover:text-gray-300">About Us</Link>
                        <Link href="/partner" className="hover:text-gray-300">Partner</Link>
                        <Link href="/contact" className="hover:text-gray-300">Contact Us</Link>
                    </div>

                    {!user ? (
                        <div className="hidden md:flex space-x-4">
                            <Link
                                href="/pages/auth/login"
                                className="px-4 py-2 bg-gray-100 text-blue-600 rounded-md font-medium hover:bg-gray-200"
                            >
                                Login
                            </Link>
                            <Link
                                href="/auth/selectRole"
                                className="px-4 py-2 bg-blue-500 rounded-md font-medium hover:bg-blue-700"
                            >
                                Register
                            </Link>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center relative">
                            <button onClick={toggleDropdown} className="focus:outline-none">
                                <Image
                                    src="/profile-placeholder.png"
                                    alt="Profile"
                                    width={40}
                                    height={40}
                                    className="rounded-full"
                                />
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 top-11 w-48 bg-white text-black rounded-md shadow-lg py-2 z-10 flex flex-col">
                                    <Link href="/about" className="block px-4 py-2 hover:bg-gray-200">About Us</Link>
                                    <Link href="/partner" className="block px-4 py-2 hover:bg-gray-200">Partner</Link>
                                    <Link href="/contact" className="block px-4 py-2 hover:bg-gray-200">Contact Us</Link>
                                    <Link href={`/pages/${user.userType}/profile/${user.user_id}`} className="block px-4 py-2 hover:bg-gray-200">View Profile</Link>
                                    <Link href="/settings" className="block px-4 py-2 hover:bg-gray-200">Settings</Link>
                                    <button onClick={signOut} className="block w-full text-left px-4 py-2 hover:bg-gray-200">Logout</button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="md:hidden flex items-center">
                        <button onClick={toggleMenu} className="text-white hover:text-gray-300 focus:outline-none">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {menuOpen && (
                <div className="md:hidden bg-blue-500 px-4 py-3 space-y-2 flex flex-col">
                    <Link href="/about" className="block hover:text-gray-300">About Us</Link>
                    <Link href="/partner" className="block hover:text-gray-300">Partner</Link>
                    <Link href="/contact" className="block hover:text-gray-300">Contact Us</Link>
                    {!user ? (
                        <>
                            <Link href="/pages/auth/login" className="block hover:text-gray-300">Login</Link>
                            <Link href="/pages/auth/selectRole" className="block hover:text-gray-300">Register</Link>
                        </>
                    ) : (
                        <>
                            <Link href={`/pages/${user.userType}/profile/${user.user_id}`} className="block hover:text-gray-300">View Profile</Link>
                            <Link href="/settings" className="block hover:text-gray-300">Settings</Link>
                            <button onClick={signOut} className="block w-full text-left hover:text-gray-300">Logout</button>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
=======
import useAuth from "@/hooks/useSession";
import {router, useRouter} from "next/navigation";
const Navibar = () => {
const {user, signOut, loading} = useAuth();
const router = useRouter();
if(loading) return router.refresh();
    router.refresh();
if(!user) {
 return  <div className="hidden md:flex space-x-4">
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
}
else{
  return (
      <nav className="bg-blue-600 text-white shadow-md rounded-b-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold">
                Rentahan
              </Link>
            </div>

            {/* Links */}
            <div className="hidden md:flex space-x-6">
              <Link href="/" className="hover:text-gray-300">
                Home
              </Link>
              <Link href="#" className="hover:text-gray-300">
                About Us
              </Link>
              <Link href="#" className="hover:text-gray-300">
                Contact
              </Link>
            </div>


            {/*<div className="hidden md:flex space-x-4">*/}
            {/*  <Link*/}
            {/*    href="/pages/auth/login"*/}
            {/*    className="px-4 py-2 bg-gray-100 text-blue-600 rounded-md font-medium hover:bg-gray-200"*/}
            {/*  >*/}
            {/*    Login*/}
            {/*  </Link>*/}
            {/*  <Link*/}
            {/*    href="/pages/auth/selectRole"*/}
            {/*    className="px-4 py-2 bg-blue-500 rounded-md font-medium hover:bg-blue-700"*/}
            {/*  >*/}
            {/*    Register*/}
            {/*  </Link>*/}
            {/*</div>*/}

            <button
                onClick={signOut}
                className="bg-red-500 text-white px-4 py-2 rounded-md ml-4"
            >
              Sign Out
            </button>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button className="text-white hover:text-gray-300 focus:outline-none focus:text-gray-300">
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16m-7 6h7"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
  );
}
};

export default Navibar;
>>>>>>> Stashed changes
