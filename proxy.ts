import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import crypto from "crypto";

/* =====================================================
   HELPERS
===================================================== */

function getClientIp(req: NextRequest): string | null {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();

    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;

    return null;
}

function hashIp(ip: string) {
    return crypto.createHash("sha256").update(ip).digest("hex");
}

async function verifyToken(token: string) {
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}

function safeRedirect(target: string, req: NextRequest) {
    if (req.nextUrl.pathname === target) {
        return NextResponse.next();
    }
    return NextResponse.redirect(new URL(target, req.url));
}

/* =====================================================
   CONSTANTS
===================================================== */

const SYSTEM_ADMIN_ROLES = ["super-admin", "superadmin", "co-admin"];

const AUTH_PAGES = [
    "/pages/auth/login",
    "/pages/auth/register",
];

const permissionMapping: Record<string, string> = {
    "/pages/system_admin/co_admin": "manage_users",
    "/pages/system_admin/propertyManagement": "approve_properties",
    "/pages/system_admin/announcement": "manage_announcements",
    "/pages/system_admin/bug_report": "view_reports",
    "/pages/system_admin/activityLog": "view_log",
    "/pages/system_admin/beta_programs": "beta",
};

/* =====================================================
   PROXY
===================================================== */

export async function proxy(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    const userToken = req.cookies.get("token")?.value;
    const adminToken = req.cookies.get("admin_token")?.value;

    const VERIFY_PAGE = "/pages/auth/verify-email";

    /* -----------------------------------------------
       ALLOW WEBHOOKS
    ------------------------------------------------ */
    if (pathname.startsWith("/api/webhook")) {
        return NextResponse.next();
    }

    /* =====================================================
       🔒 HIDE LOGIN / REGISTER IF ALREADY LOGGED IN
    ===================================================== */

    const isUserAuthPage = AUTH_PAGES.some(
        (page) => pathname === page || pathname.startsWith(`${page}/`)
    );

    const isAdminLoginPage = pathname === "/pages/admin_login";

    /* ---------- ADMIN ALREADY LOGGED IN ---------- */
    if (adminToken && isAdminLoginPage) {
        const decodedAdmin: any = await verifyToken(adminToken);
        if (decodedAdmin && SYSTEM_ADMIN_ROLES.includes(decodedAdmin.role)) {
            return safeRedirect("/pages/system_admin/dashboard", req);
        }
    }

    /* ---------- USER ALREADY LOGGED IN ---------- */
    if (userToken && isUserAuthPage) {
        const decodedUser: any = await verifyToken(userToken);
        if (decodedUser) {
            if (decodedUser.userType === "landlord") {
                return safeRedirect("/pages/landlord/dashboard", req);
            }
            if (decodedUser.userType === "tenant") {
                return safeRedirect("/pages/tenant/feeds", req);
            }
        }
    }

    /* =====================================================
       🔥 ADMIN FLOW
    ===================================================== */

    if (pathname.startsWith("/pages/system_admin")) {
        if (!adminToken) {
            const adminLogin = new URL("/pages/admin_login", req.url);
            adminLogin.searchParams.set("callbackUrl", pathname + search);
            return NextResponse.redirect(adminLogin);
        }

        const decodedAdmin: any = await verifyToken(adminToken);

        if (!decodedAdmin) {
            const res = NextResponse.redirect(
                new URL("/pages/admin_login", req.url)
            );
            res.cookies.delete("admin_token");
            return res;
        }

        const { role, permissions = [], ip_hash, status } = decodedAdmin;

        /* 🔒 STATUS CHECK */
        if (status && status !== "active") {
            return safeRedirect("/pages/error/accountSuspended", req);
        }

        /* 🔒 ROLE CHECK */
        if (!SYSTEM_ADMIN_ROLES.includes(role)) {
            return safeRedirect("/pages/error/accessDenied", req);
        }

        /* 🔒 IP BINDING */
        const clientIp = getClientIp(req);

        if (!clientIp || !ip_hash || hashIp(clientIp) !== ip_hash) {
            const res = NextResponse.redirect(
                new URL("/pages/admin_login?reason=ip_changed", req.url)
            );
            res.cookies.delete("admin_token");
            return res;
        }

        /* 🔒 PERMISSION CHECK */
        const matchedEntry = Object.entries(permissionMapping).find(
            ([route]) => pathname === route || pathname.startsWith(`${route}/`)
        );

        if (matchedEntry) {
            const [, requiredPermission] = matchedEntry;
            if (!permissions.includes(requiredPermission)) {
                return safeRedirect("/pages/error/accessDenied", req);
            }
        }

        return NextResponse.next();
    }

    /* =====================================================
       🔥 USER FLOW
    ===================================================== */

    if (!userToken) {
        const isAuthPage =
            AUTH_PAGES.some(
                (page) => pathname === page || pathname.startsWith(`${page}/`)
            ) ||
            pathname === "/pages/auth/selectRole";

        if (!isAuthPage) {
            const loginUrl = new URL("/pages/auth/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname + search);
            return NextResponse.redirect(loginUrl);
        }

        return NextResponse.next();
    }


    const decodedUser: any = await verifyToken(userToken);

    if (!decodedUser) {
        const res = NextResponse.redirect(
            new URL("/pages/auth/login", req.url)
        );
        res.cookies.delete("token");
        return res;
    }

    const { userType, emailVerified, status } = decodedUser;

    /* 🔒 STATUS CHECK */
    if (status && status !== "active") {
        return safeRedirect("/pages/error/accountSuspended", req);
    }

    /* 🔒 EMAIL VERIFICATION */
    if (emailVerified === false) {
        if (pathname !== VERIFY_PAGE) {
            return safeRedirect(VERIFY_PAGE, req);
        }
        return NextResponse.next();
    }

    /* 🔒 ROLE ROUTING */
    if (pathname.startsWith("/pages/tenant") && userType !== "tenant") {
        return safeRedirect("/pages/error/accessDenied", req);
    }

    if (pathname.startsWith("/pages/landlord") && userType !== "landlord") {
        return safeRedirect("/pages/error/accessDenied", req);
    }

    return NextResponse.next();
}

/* =====================================================
   MATCHER
===================================================== */

export const config = {
    matcher: [
        // "/pages/auth/:path*",
        "/pages/tenant/:path*",
        "/pages/landlord/:path*",
        "/pages/system_admin/:path*",
        "/pages/commons/:path*",
        "/api/webhook/:path*",
    ],
};
