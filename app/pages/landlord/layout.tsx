"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";
import MobileLandlordSidenav from "@/components/navigation/MobileLandlordSidenav";

import {
    Home,
    Building,
    Wallet,
    Banknote,
    ChartArea,
    LogOut,
    MessageSquareMore,
    Calendar,
    Construction,
    Megaphone,
    Menu,
    Users,
    Settings,
    AlertCircle,
    Handshake,
} from "lucide-react";

/* ===============================
   LAZY COMPONENTS
================================ */
const NotificationSection = dynamic(
    () => import("@/components/notification/notifCenter"),
    { ssr: false }
);

const SendTenantInviteModal = dynamic(
    () => import("@/components/landlord/properties/sendInvite"),
    { ssr: false }
);

/* ===============================
   LAYOUT
================================ */
export default function LandlordLayout({
                                           children,
                                       }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, fetchSession, signOut } = useAuthStore();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [authReady, setAuthReady] = useState(false);

    /* ===============================
       AUTH
    ================================ */
    useEffect(() => {
        if (!user) {
            fetchSession().finally(() => setAuthReady(true));
        } else {
            setAuthReady(true);
        }
    }, [user, fetchSession]);

    useEffect(() => {
        if (authReady && user && user.userType !== "landlord") {
            router.replace("/pages/auth/login");
        }
    }, [authReady, user, router]);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        document.body.style.overflow = isSidebarOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [isSidebarOpen]);

    const isInsideProperty = useMemo(
        () =>
            pathname.includes("/pages/landlord/properties/") &&
            !pathname.includes("/pages/commons/profile"),
        [pathname]
    );

    /* ===============================
       NAV GROUPS
    ================================ */
    const navGroups = useMemo(
        () => [
            {
                title: "Core",
                items: [
                    { label: "Dashboard", href: "/pages/landlord/dashboard", icon: Home },
                    { label: "Payments", href: "/pages/landlord/payments", icon: Wallet },
                    { label: "Properties", href: "/pages/landlord/property-listing", icon: Building },
                    { label: "My Tenants", href: "/pages/landlord/list_of_tenants", icon: Users },
                    { label: "Messages", href: "/pages/landlord/chat", icon: MessageSquareMore },
                ],
            },
            {
                title: "Operations",
                items: [
                    { label: "Work Orders", href: "/pages/landlord/maintenance-request", icon: Construction },
                    { label: "Calendar", href: "/pages/landlord/booking-appointment", icon: Calendar },
                    { label: "Announcements", href: "/pages/landlord/announcement", icon: Megaphone },
                ],
            },
            {
                title: "Finance & Strategy",
                items: [
                    { label: "Analytics", href: "/pages/landlord/analytics/performance", icon: ChartArea },
                    { label: "Tax Compliance", href: "/pages/landlord/taxManagement", icon: Banknote },
                ],
            },
            {
                title: "Support",
                items: [
                    { label: "Help & Support", href: "/pages/public/help", icon: Handshake },
                ],
            },
        ],
        []
    );

    const handleLogout = async () => {
        await signOut();
        router.push("/pages/auth/login");
    };

    if (!authReady) {
        return <LoadingScreen message="Preparing your workspace..." />;
    }

    if (!user || user.userType !== "landlord") {
        return <LoadingScreen message="Redirecting..." />;
    }

    if (isInsideProperty) {
        return <main className="min-h-screen">{children}</main>;
    }

    /* ===============================
       RENDER
    ================================ */
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-72 bg-white shadow-xl z-40">
                <div className="flex flex-col h-full">
                    {/* HEADER */}
                    <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
                        <div className="flex justify-between items-center">
                            <Link href="/pages/landlord/dashboard">
                                <h1 className="text-2xl font-bold">Upkyp</h1>
                            </Link>
                            <NotificationSection user={user} admin={null} />
                        </div>
                        <p className="text-xs text-white/80">Landlord Portal</p>
                    </div>

                    {/* PROFILE */}
                    <div className="px-4 py-4 border-b bg-gray-50">
                        <div className="flex items-center gap-3">
                            <Image
                                src={
                                    user.profilePicture ||
                                    "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                                }
                                alt="Profile"
                                width={44}
                                height={44}
                                className="rounded-xl object-cover border-2 border-gray-200"
                            />

                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                    {user.firstName && user.lastName
                                        ? `${user.firstName} ${user.lastName}`
                                        : user.companyName || user.email}
                                </p>

                                <p className="text-xs text-gray-500">Landlord</p>

                                {/* SUBSCRIPTION — DO NOT REMOVE */}
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
        <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full
            ${
                user.subscription?.plan_name === "pro"
                    ? "bg-emerald-100 text-emerald-700"
                    : user.subscription?.plan_name === "enterprise"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-200 text-gray-600"
            }`}
        >
          {user.subscription?.plan_name
              ? user.subscription.plan_name.toUpperCase()
              : "-"}
        </span>
                                </div>

                                {/* LANDLORD ID — DO NOT REMOVE */}
                                {user.landlord_id && (
                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                        ID: {user.landlord_id}
                                    </p>
                                )}
                            </div>

                            <Link href="/pages/commons/profile">
                                <Settings className="w-5 h-5 text-gray-500 hover:text-blue-600" />
                            </Link>
                        </div>
                    </div>

                    {/* NAV */}
                    <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
                        {navGroups.map((group) => (
                            <div key={group.title}>
                                <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    {group.title}
                                </p>
                                {group.items.map(({ label, href, icon: Icon }) => {
                                    const active =
                                        pathname === href || pathname.startsWith(href + "/");
                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                                                active
                                                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                                                    : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {label}
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>

                    {/* FOOTER LOGOUT */}
                    <div className="p-4 border-t bg-gray-50">
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full flex items-center justify-center gap-2
                         px-4 py-2 bg-white border rounded-lg
                         hover:bg-red-50 hover:text-red-600"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* MOBILE HEADER */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14
                      bg-gradient-to-r from-blue-600 to-emerald-600
                      flex items-center justify-between px-4 z-50">
                <Link href="/pages/landlord/dashboard">
                    <h1 className="text-xl font-bold text-white">Upkyp</h1>
                </Link>
                <div className="flex gap-2">
                    <NotificationSection user={user} admin={null} />
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-white/10"
                    >
                        <Menu className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* MOBILE SIDENAV (COMPONENT) */}
            <MobileLandlordSidenav
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                navGroups={navGroups}
                landlordId={user.landlord_id}
                InviteModal={SendTenantInviteModal}
                onLogoutClick={() => setShowLogoutConfirm(true)}
                user={user}
            />


            {/* LOGOUT CONFIRM */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-7 h-7 text-red-600" />
                            </div>
                            <h3 className="font-bold text-lg">Confirm Logout</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Are you sure you want to logout?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 border rounded-xl py-3"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 bg-red-600 text-white rounded-xl py-3"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN */}
            <main className="flex-1 lg:pl-72 pt-14 lg:pt-0">{children}</main>
        </div>
    );
}
