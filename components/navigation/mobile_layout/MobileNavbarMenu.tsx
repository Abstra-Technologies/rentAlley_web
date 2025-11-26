"use client";
import Link from "next/link";
import Image from "next/image";

export default function MobileNavbarMenu({
                                             menuOpen,
                                             setMenuOpen,
                                             user,
                                             admin,
                                             navigationLinks,
                                             hasLease,
                                             handleLogout,
                                             mobileMenuRef,
                                         }: any) {
    return (
        menuOpen && (
            <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-60 transition-opacity duration-300 backdrop-blur-sm">
                <div
                    ref={mobileMenuRef}
                    className="fixed inset-y-0 right-0 max-w-sm w-full bg-gradient-to-b from-blue-600 via-blue-700 to-emerald-600 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto border-l-4 border-emerald-400"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-emerald-500/30 bg-gradient-to-r from-blue-600/80 to-emerald-600/80 backdrop-blur-sm">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-white/20 to-white/15 rounded-xl backdrop-blur-sm border border-white/30 shadow-lg">
                                <Image
                                    src="/upkyptxt.png"
                                    alt="UpKyp Logo"
                                    width={80}
                                    height={20}
                                    priority
                                    className="brightness-0 invert"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => setMenuOpen(false)}
                            className="p-2 rounded-xl hover:bg-gradient-to-r hover:from-white/25 hover:to-white/20 transition-all duration-200 backdrop-blur-sm border border-white/30 hover:border-white/50 shadow-lg"
                            aria-label="Close menu"
                        >
                            <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-4 sm:px-6 py-4 space-y-2">
                        {/* User Info */}
                        {(user || admin) && (
                            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20 shadow-lg">
                                <div className="flex items-center space-x-4">
                                    <Image
                                        src={
                                            user?.profilePicture ||
                                            admin?.profile_picture ||
                                            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                                        }
                                        alt="Profile"
                                        width={56}
                                        height={56}
                                        className="w-14 h-14 object-cover rounded-full border-3 border-white/30 shadow-lg"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-white text-lg truncate">
                                            {user?.firstName || admin?.firstName || "User"}
                                        </div>
                                        <div className="text-sm text-blue-100 truncate opacity-90">
                                            {user?.email || admin?.email || ""}
                                        </div>
                                        {user && (
                                            <div className="flex items-center space-x-1 mt-2">
                                                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-2 py-1 rounded-lg border border-yellow-400/30 backdrop-blur-sm">
                          <span className="text-yellow-200 text-xs font-medium">
                            ⭐ {user?.points ?? 0} points
                          </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="space-y-1">
                            {navigationLinks.map((link, index) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="flex items-center py-4 px-4 rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-200 text-white group border border-transparent hover:border-white/20 shadow-sm hover:shadow-lg"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <div className="w-10 h-10 bg-gradient-to-r from-white/20 to-white/10 rounded-xl flex items-center justify-center mr-3 group-hover:from-white/30 group-hover:to-white/20 transition-all border border-white/20 group-hover:border-white/40">
                                        <span className="text-white text-sm font-medium">{index + 1}</span>
                                    </div>
                                    <span className="font-medium">{link.label}</span>
                                    <svg
                                        className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 transition-opacity"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </Link>
                            ))}

                            {/* 👤 View Profile */}
                            {(user || admin) && (
                                <Link
                                    href={
                                        user
                                            ? `/pages/commons/profile`
                                            : `/pages/system_admin/profile/${admin.admin_id}`
                                    }
                                    className="flex items-center py-4 px-4 rounded-xl mt-3 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-emerald-400/10 transition-all duration-200 text-white group border border-transparent hover:border-emerald-400/40 shadow-sm hover:shadow-lg"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 rounded-xl flex items-center justify-center mr-3 group-hover:from-emerald-500/30 group-hover:to-emerald-400/30 transition-all border border-emerald-400/30 group-hover:border-emerald-400/40">
                                        <svg
                                            className="w-4 h-4 text-emerald-200"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                    </div>
                                    <span className="font-medium">View Profile</span>
                                    <svg
                                        className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 transition-opacity"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </Link>
                            )}
                        </div>

                        {/* Logout */}
                        {(user || admin) && (
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setMenuOpen(false);
                                }}
                                className="flex items-center w-full py-4 px-4 rounded-xl text-red-200 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-400/20 hover:text-white transition-all duration-200 mt-4 group border border-red-400/20 hover:border-red-400/40 shadow-sm hover:shadow-lg"
                            >
                                <div className="w-10 h-10 bg-gradient-to-r from-red-500/20 to-red-400/20 rounded-xl flex items-center justify-center mr-3 group-hover:from-red-500/30 group-hover:to-red-400/30 transition-all border border-red-400/30 group-hover:border-red-400/40">
                                    <svg
                                        className="w-4 h-4 text-red-200"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                </div>
                                <span className="font-medium">Logout</span>
                            </button>
                        )}

                        {/* Page_footer */}
                        <div className="mt-8 pt-6 border-t border-white/20">
                            <div className="text-center text-white/60 text-sm">
                                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                    <p className="mb-2 font-medium">UpKyp Rental Platform</p>
                                    <p className="text-xs opacity-75">
                                        Making rental simple & secure
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    );
}
