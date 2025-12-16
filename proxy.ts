import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

/* ---------------- JWT VERIFY ---------------- */
async function verifyToken(token: string) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}

/* ---------------- ROLE & PERMISSION MAP ---------------- */
const SYSTEM_ADMIN_ROLES = ["super-admin", "superadmin", "co-admin"];

const permissionMapping: Record<string, string> = {
    "/pages/system_admin/co_admin": "manage_users",
    "/pages/system_admin/propertyManagement": "approve_properties",
    "/pages/system_admin/announcement": "manage_announcements",
    "/pages/system_admin/bug_report": "view_reports",
    "/pages/system_admin/activityLog": "view_log",
    "/pages/system_admin/tenant_landlord": "tenant_landlord_management",
};

const excludePages = new Set([
    "/pages/system_admin/dashboard",
    "/pages/system_admin/profile",
    "/pages/system_admin/supportIssues",
]);

/* ----------------
 MIDDLEWARE OR PROXY FOR NEXT16
---------------- */
export async function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get("token")?.value;

    /* ---------- NO TOKEN ---------- */
    if (!token) {
        if (pathname.startsWith("/pages/system_admin")) {
            return NextResponse.redirect(new URL("/pages/admin_login", req.url));
        }

        return NextResponse.redirect(new URL("/pages/auth/login", req.url));
    }

    const decoded: any = await verifyToken(token);

    /* ---------- INVALID TOKEN ---------- */
    if (!decoded) {
        return NextResponse.redirect(new URL("/pages/auth/login", req.url));
    }

    const { userType, role, permissions = [] } = decoded;

    /* ---------- TENANT ---------- */
    if (pathname.startsWith("/pages/tenant") && userType !== "tenant") {
        return NextResponse.redirect(
            new URL("/pages/error/accessDenied", req.url)
        );
    }

    /* ---------- LANDLORD ---------- */
    if (pathname.startsWith("/pages/landlord") && userType !== "landlord") {
        return NextResponse.redirect(
            new URL("/pages/error/accessDenied", req.url)
        );
    }

    /* ---------- SYSTEM ADMIN ---------- */
    if (pathname.startsWith("/pages/system_admin")) {
        if (!SYSTEM_ADMIN_ROLES.includes(role)) {
            return NextResponse.redirect(
                new URL("/pages/error/accessDenied", req.url)
            );
        }

        if (excludePages.has(pathname)) {
            return NextResponse.next();
        }

        const matchedEntry = Object.entries(permissionMapping).find(
            ([route]) => pathname === route || pathname.startsWith(`${route}/`)
        );

        if (matchedEntry) {
            const [, requiredPermission] = matchedEntry;

            if (!permissions.includes(requiredPermission)) {
                return NextResponse.redirect(
                    new URL("/pages/error/accessDenied", req.url)
                );
            }
        }
    }

    return NextResponse.next();
}

/* ---------------- MATCHER ---------------- */
export const config = {
    matcher: [
        "/pages/tenant/:path*",
        "/pages/tenant/rentalPortal/:path*",
        "/pages/landlord/:path*",
        "/pages/system_admin/:path*",
        "/pages/commons/:path*",
    ],
};
