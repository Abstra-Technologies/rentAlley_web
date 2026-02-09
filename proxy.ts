import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import crypto from "crypto";

/* =====================================================
   HELPERS
===================================================== */
function getClientIp(req: NextRequest): string | null {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;

    return null;
}

function hashIp(ip: string) {
    return crypto.createHash("sha256").update(ip).digest("hex");
}

async function verifyToken(token: string) {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    try {
        const { payload } = await jwtVerify(token, secret);
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
};

const excludePages = new Set([
    "/pages/system_admin/dashboard",
    "/pages/system_admin/profile",
    "/pages/system_admin/supportIssues",
]);

/* =====================================================
   PROXY / MIDDLEWARE
===================================================== */
export async function proxy(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    const token = req.cookies.get("token")?.value;

    /* -----------------------------------------------
       ALLOW WEBHOOKS
    ------------------------------------------------ */
    if (pathname.startsWith("/api/webhook")) {
        return NextResponse.next();
    }

    /* -----------------------------------------------
       NO TOKEN
    ------------------------------------------------ */
    if (!token) {
        const callbackUrl = pathname + search;

        if (pathname.startsWith("/pages/system_admin")) {
            const adminLogin = new URL("/pages/admin_login", req.url);
            adminLogin.searchParams.set("callbackUrl", callbackUrl);
            return NextResponse.redirect(adminLogin);
        }

        if (
            pathname.startsWith("/pages/tenant") ||
            pathname.startsWith("/pages/landlord") ||
            pathname.startsWith("/pages/commons")
        ) {
            const loginUrl = new URL("/pages/auth/login", req.url);
            loginUrl.searchParams.set("callbackUrl", callbackUrl);
            return NextResponse.redirect(loginUrl);
        }

        return NextResponse.next();
    }

    /* -----------------------------------------------
       VERIFY TOKEN
    ------------------------------------------------ */
    const decoded: any = await verifyToken(token);

    if (!decoded) {
        const res = NextResponse.redirect(
            new URL("/pages/auth/login", req.url)
        );
        res.cookies.delete("token");
        return res;
    }

    const { userType, role, permissions = [], ip_hash } = decoded;

    /* -----------------------------------------------
       BLOCK AUTH PAGES WHEN LOGGED IN
    ------------------------------------------------ */
    const isAuthPage = AUTH_PAGES.some(
        (page) => pathname === page || pathname.startsWith(`${page}/`)
    );

    const hasCallback = req.nextUrl.searchParams.has("callbackUrl");

    if (isAuthPage && !hasCallback) {
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
       SYSTEM ADMIN ACCESS (WITH IP ENFORCEMENT)
    ------------------------------------------------ */
    if (pathname.startsWith("/pages/system_admin")) {
        // Role check
        if (!SYSTEM_ADMIN_ROLES.includes(role)) {
            return NextResponse.redirect(
                new URL("/pages/error/accessDenied", req.url)
            );
        }

        // 🔐 IP binding enforcement
        const clientIp = getClientIp(req);

        if (!clientIp || !ip_hash) {
            const res = NextResponse.redirect(
                new URL("/pages/admin_login?reason=ip_missing", req.url)
            );
            res.cookies.delete("token");
            return res;
        }

        const currentIpHash = hashIp(clientIp);

        if (currentIpHash !== ip_hash) {
            const res = NextResponse.redirect(
                new URL("/pages/admin_login?reason=ip_changed", req.url)
            );
            res.cookies.delete("token");
            return res;
        }

        // Allow excluded admin pages
        if (excludePages.has(pathname)) {
            return NextResponse.next();
        }

        // Permission-based routing
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
