"use client";

import { usePathname, redirect } from "next/navigation";
import useAuthStore from "../../zustand/authStore";
import "../global.css";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { admin, isLoading } = useAuthStore();

    // Allow login page
    if (pathname === "/login") {
        return (
            <html lang="en">
            <body>{children}</body>
            </html>
        );
    }

    // Protect admin routes
    if (!isLoading && !admin) {
        redirect("/login");
    }

    return (
        <html lang="en">
        <body className="bg-gray-100 text-gray-900">
        {children}
        </body>
        </html>
    );
}
