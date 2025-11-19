"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import {
    UserIcon,
    ShieldCheckIcon,
    ArrowRightOnRectangleIcon,
    CreditCardIcon,
} from "@heroicons/react/24/outline";

import {
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Settings,
    AlertCircle,
} from "lucide-react";

import useAuthStore from "@/zustand/authStore";
import { logEvent } from "@/utils/gtag";

export default function SideNavProfile({ children }: { children: React.ReactNode }) {
    const { user, signOut, signOutAdmin } = useAuthStore();
    const pathname = usePathname();
    const router = useRouter();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const menuItems = [
        { href: `/pages/commons/profile`, icon: UserIcon, label: "Profile" },
        { href: `/pages/commons/profile/security`, icon: ShieldCheckIcon, label: "Security & Privacy" },
        ...(user?.userType === "landlord"
            ? [
                {
                    href: "/pages/landlord/subsciption_plan",
                    icon: CreditCardIcon,
                    label: "View Subscription",
                },
            ]
            : []),
    ];

    const handleLogout = () => {
        if (!user) return;
        user?.userType ? signOut() : signOutAdmin();
        router.push("/pages/auth/login");
    };

    const hasNavbar = user?.userType === "tenant";

    const mainPageUrl =
        user?.userType === "landlord"
            ? "/pages/landlord/dashboard"
            : "/pages/tenant/feeds";

    const mainPageLabel =
        user?.userType === "landlord" ? "Back to Dashboard" : "Back to Feeds";

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">

            {/*---------------------------------------------*/}
            {/* DESKTOP SIDEBAR */}
            {/*---------------------------------------------*/}
            <aside
                className={`hidden md:flex md:flex-col md:fixed md:bottom-0 md:z-40 md:w-72 md:bg-white md:shadow-xl ${
                    hasNavbar ? "md:top-16" : "md:top-0"
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm">
                        <h1 className="text-lg font-bold text-white">Account Settings</h1>
                        <p className="text-xs text-white/80 mt-1">Manage your profile</p>
                    </div>

                    {/* Back Button */}
                    <div className="px-4 pt-4 pb-2">
                        <button
                            onClick={() => router.push(mainPageUrl)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 hover:from-blue-100 hover:to-emerald-100 rounded-lg"
                        >
                            <ChevronLeft className="w-5 h-5 text-blue-600" />
                            {mainPageLabel}
                        </button>
                    </div>

                    {/* Profile Section */}
                    {user && (
                        <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3 p-2">
                                <Image
                                    src={
                                        user.profilePicture ||
                                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                                    }
                                    alt="Profile"
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                />

                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {user.firstName
                                            ? `${user.firstName} ${user.lastName}`
                                            : user.companyName || user.email}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {user.userType === "landlord"
                                            ? "Landlord Account"
                                            : user.userType === "tenant"
                                                ? "Tenant Account"
                                                : "Admin Account"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Menu */}
                    <nav className="flex-1 px-3 py-4 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                                        isActive
                                            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg"
                                            : "text-gray-700 hover:bg-gray-100 hover:shadow-md"
                                    }`}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/40 rounded-r-full" />
                                    )}

                                    <Icon className="w-5 h-5" />
                                    <span className="text-sm">{item.label}</span>

                                    {isActive && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
                                    )}
                                </Link>
                            );
                        })}

                        {/* Logout */}
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 hover:shadow-md w-full"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                            <span className="text-sm">Logout</span>
                        </button>
                    </nav>
                </div>
            </aside>

            {/*---------------------------------------------*/}
            {/* MOBILE MENU BUTTON */}
            {/*---------------------------------------------*/}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden fixed bottom-24 right-6 z-50 p-4 rounded-full shadow-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/*---------------------------------------------*/}
            {/* MOBILE SIDEBAR */}
            {/*---------------------------------------------*/}
            {isSidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={() => setIsSidebarOpen(false)}
                    />

                    <aside className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="px-4 py-4 bg-gradient-to-r from-blue-600 to-emerald-600 text-white flex justify-between items-center">
                            <h2 className="text-lg font-bold">Account Settings</h2>
                            <button onClick={() => setIsSidebarOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Profile */}
                        {user && (
                            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <Image
                                        src={
                                            user.profilePicture ||
                                            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                                        }
                                        alt="Profile"
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">
                                            {user.firstName
                                                ? `${user.firstName} ${user.lastName}`
                                                : user.companyName || user.email}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {user.userType}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <nav className="flex-1 overflow-y-auto p-4 space-y-3">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition ${
                                            isActive
                                                ? "bg-gradient-to-br from-blue-50 to-emerald90 border-blue-200"
                                                : "bg-white border-gray-100 hover:border-gray-200"
                                        }`}
                                    >
                                        <div className="p-3 rounded-xl bg-gray-50">
                                            <Icon className="w-6 h-6 text-gray-600" />
                                        </div>

                                        <span className="font-medium text-sm">{item.label}</span>
                                        <ChevronRight />
                                    </Link>
                                );
                            })}

                            {/* Logout */}
                            <button
                                onClick={() => {
                                    setIsSidebarOpen(false);
                                    setShowLogoutConfirm(true);
                                }}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-700"
                            >
                                <ArrowRightOnRectangleIcon className="w-6 h-6" />
                                Logout
                            </button>
                        </nav>
                    </aside>
                </>
            )}

            {/*---------------------------------------------*/}
            {/* LOGOUT MODAL */}
            {/*---------------------------------------------*/}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>

                        <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
                            Confirm Logout
                        </h3>

                        <p className="text-sm text-gray-600 text-center mb-6">
                            Are you sure you want to sign out?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-2.5 border rounded-lg text-gray-700 border-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/*---------------------------------------------*/}
            {/* MAIN CONTENT */}
            {/*---------------------------------------------*/}
            <main className="flex-1 md:pl-72 pt-14 md:pt-0 bg-gradient-to-br from-gray-50 via-blue-50/20 to-emerald-50/20">
                {children}
            </main>
        </div>
    );
}
