import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

async function verifyToken(token: string) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    try {
        const { payload } = await jwtVerify(token, secret);
        console.log("landlord payload: ", payload);
        return payload;
    } catch {
        return null;
    }
}

/* =====================================================
   CONSTANTS
===================================================== */
const SYSTEM_ADMIN_ROLES = ["super-admin", "superadmin", "co-admin"];

const AUTH_PAGES = [
    "/pages/auth/login",
    "/pages/auth/register",
    "/pages/auth/select-role",
];

const permissionMapping: Record<string, string> = {
    "/pages/system_admin/co_admin": "manage_users",
    "/pages/system_admin/propertyManagement": "approve_properties",
    "/pages/system_admin/announcement": "manage_announcements",
    "/pages/system_admin/bug_report": "view_reports",
    "/pages/system_admin/activityLog": "view_log",
    "/pages/system_admin/beta_programs": "beta",
    "/pages/system_admin/tenant_landlord": "tenant_landlord_management",
};

const excludePages = new Set([
    "/pages/system_admin/dashboard",
    "/pages/system_admin/profile",
    "/pages/system_admin/supportIssues",
]);

/* =====================================================
   PROXY (MIDDLEWARE)
===================================================== */
export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get("token")?.value;

    if (pathname.startsWith("/api/webhook")) {
        return NextResponse.next();
    }

    /* -----------------------------------------------
       NO TOKEN
    ------------------------------------------------ */
    if (!token) {
        // Block system admin pages
        if (pathname.startsWith("/pages/system_admin")) {
            return NextResponse.redirect(
                new URL("/pages/admin_login", req.url)
            );
        }



        // Block protected app routes
        if (
            pathname.startsWith("/pages/tenant") ||
            pathname.startsWith("/pages/landlord") ||
            pathname.startsWith("/pages/commons")
        ) {
            return NextResponse.redirect(
                new URL("/pages/auth/login", req.url)
            );
        }

        return NextResponse.next();
    }

    /* -----------------------------------------------
       VERIFY TOKEN
    ------------------------------------------------ */
    const decoded: any = await verifyToken(token);

    if (!decoded) {
        return NextResponse.redirect(
            new URL("/pages/auth/login", req.url)
        );
    }

    const { userType, role, permissions = [] } = decoded;

    /* -----------------------------------------------
       BLOCK AUTH PAGES WHEN LOGGED IN
    ------------------------------------------------ */
    const isAuthPage = AUTH_PAGES.some(
        (page) => pathname === page || pathname.startsWith(`${page}/`)
    );

    if (isAuthPage) {
        if (SYSTEM_ADMIN_ROLES.includes(role)) {
            return NextResponse.redirect(
                new URL("/pages/system_admin/dashboard", req.url)
            );
        }

        if (userType === "landlord") {
            return NextResponse.redirect(
                new URL("/pages/landlord/dashboard", req.url)
            );
        }

        if (userType === "tenant") {
            return NextResponse.redirect(
                new URL("/pages/tenant/feeds", req.url)
            );
        }

        return NextResponse.redirect(
            new URL("/pages/auth/login", req.url)
        );
    }

    /* -----------------------------------------------
       TENANT ACCESS
    ------------------------------------------------ */
    if (pathname.startsWith("/pages/tenant") && userType !== "tenant") {
        return NextResponse.redirect(
            new URL("/pages/error/accessDenied", req.url)
        );
    }

    /* -----------------------------------------------
       LANDLORD ACCESS
    ------------------------------------------------ */
    if (pathname.startsWith("/pages/landlord") && userType !== "landlord") {
        return NextResponse.redirect(
            new URL("/pages/error/accessDenied", req.url)
        );
    }

    /* -----------------------------------------------
       SYSTEM ADMIN ACCESS
    ------------------------------------------------ */
    if (pathname.startsWith("/pages/system_admin")) {
        if (!SYSTEM_ADMIN_ROLES.includes(role)) {
            return NextResponse.redirect(
                new URL("/pages/error/accessDenied", req.url)
            );
        }

        // Allow excluded admin pages
        if (excludePages.has(pathname)) {
            return NextResponse.next();
        }

        // Permission-based access
        const matchedEntry = Object.entries(permissionMapping).find(
            ([route]) =>
                pathname === route || pathname.startsWith(`${route}/`)
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

/* =====================================================
   MATCHER
===================================================== */
export const config = {
    matcher: [
        "/pages/auth/:path*",
        "/pages/tenant/:path*",
        "/pages/tenant/rentalPortal/:path*",
        "/pages/landlord/:path*",
        "/pages/system_admin/:path*",
        "/pages/commons/:path*",
        "/api/webhook/:path*",

    ],
};
