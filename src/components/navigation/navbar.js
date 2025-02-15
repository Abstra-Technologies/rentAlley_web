"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import useAuth from "../../../hooks/useSession";
import { onMessage } from "firebase/messaging";
import { messaging } from "../../pages/lib/firebaseConfig";
import { CiBellOn } from "react-icons/ci";
import { io } from "socket.io-client";
import Swal from "sweetalert2";
import useAuthStore from "../../pages/zustand/authStore";

const Navbar = () => {
    const { user, admin, loading, signOut, signOutAdmin } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
    const toggleNotifications = () => setNotifOpen(!notifOpen);
    const socket = io("http://localhost:3000");
    const [newNotification, setNewNotification] = useState(null);

    useEffect(() => {
        useAuthStore.getState().fetchSession();
        setHydrated(true);

    }, []);

    const handleLogout = async () => {
        if (admin) {
            await signOutAdmin();
        } else {
            await signOut();
        }
        setDropdownOpen(false);
    };

    useEffect(() => {
        if (user) {
            fetch(`/api/notification/fetch?user_id=${user.user_id}`)
                .then((res) => res.json())
                .then((data) => setNotifications(data.notifications))
                .catch((error) => console.error("Error fetching notifications:", error));
        }

        if (user) {
            socket.emit("join", user.user_id);
            socket.on("notification", (newNotif) => {
                setNotifications((prev) => [newNotif, ...prev]);
                setNewNotification(newNotif);
                Swal.fire({
                    title: newNotif.title,
                    text: newNotif.body,
                    icon: "info",
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 5000,
                });
            });
        }

        return () => {
            socket.off("notification");
        };
    }, [user]);

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

                    {/* Notification Bell */}
                    {user || admin ? (
                        <div className="relative">
                            <button onClick={toggleNotifications} className="relative focus:outline-none">
                                <CiBellOn />
                                {notifications.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>

                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white text-black rounded-md shadow-lg py-2 z-10">
                                    <h3 className="text-gray-800 font-bold px-4 pb-2">Notifications</h3>
                                    {notifications.length === 0 ? (
                                        <p className="px-4 py-2 text-gray-600">No new notifications</p>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div key={notif.id} className="border-b px-4 py-2">
                                                <p className="font-semibold">{notif.title}</p>
                                                <p className="text-sm text-gray-600">{notif.body}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}

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
                                    <Link href={`/pages/${user?.userType}/dashboard`} className="block px-4 py-2 hover:bg-gray-200">
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
