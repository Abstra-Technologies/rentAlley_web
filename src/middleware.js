import { NextResponse } from "next/server";
import { jwtVerify } from "jose";


async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

const permissionMapping = {
  "/pages/system_admin/co_admin": "manage_users",
  "/pages/system_admin/propertyManagement": "approve_properties",
  "/pages/system_admin/announcement": "manage_announcements",
  "/pages/system_admin/bug_report": "view_reports",
  "/pages/system_admin/activityLog": "view_log",
  "/pages/system_admin/tenant_landlord": "tenant_landlord_management",
};

// Pages that do not require permission checks
const excludePages = [
  "/pages/system_admin/dashboard",
  "/pages/system_admin/profile",
  "/pages/system_admin/supportIssues",

];

export async function middleware(req) {
  const token = req.cookies.get("token")?.value;
  // const secrets = await getSecrets();
  //
  // process.env.DB_HOST = secrets.DB_HOST;
  // process.env.DB_USER = secrets.DB_USER;
  // process.env.DB_PASSWORD = secrets.DB_PASSWORD;
  // process.env.DB_NAME = secrets.DB_NAME;
  // process.env.DB_PORT = secrets.DB_PORT;
  // process.env.GOOGLE_CLIENT_ID = secrets.GOOGLE_CLIENT_ID;
  // process.env.GOOGLE_CLIENT_SECRET = secrets.GOOGLE_CLIENT_SECRET;
  // process.env.NEXTAUTH_URL = secrets.NEXTAUTH_URL;
  // process.env.NEXTAUTH_SECRET = secrets.NEXTAUTH_SECRET;
  // process.env.EMAIL_USER = secrets.EMAIL_USER;
  // process.env.EMAIL_PASS = secrets.EMAIL_PASS;
  // process.env.JWT_SECRET = secrets.JWT_SECRET;
  // process.env.NODE_ENV = secrets.NODE_ENV;
  // process.env.Public_Key = secrets.Public_Key;
  // process.env.Private_Key = secrets.Private_Key;
  // process.env.RESET_TOKEN_SECRET = secrets.RESET_TOKEN_SECRET;
  // process.env.REDIRECT_URI = secrets.REDIRECT_URI;
  // process.env.REDIRECT_URI_SIGNIN = secrets.REDIRECT_URI_SIGNIN;
  // process.env.AWS_ACCESS_KEY_ID = secrets.AWS_ACCESS_KEY_ID;
  // process.env.AWS_SECRET_ACCESS_KEY = secrets.AWS_SECRET_ACCESS_KEY;
  // process.env.S3_BUCKET_NAME = secrets.S3_BUCKET_NAME;
  // process.env.AWS_REGION = secrets.AWS_REGION;
  // process.env.ENCRYPTION_SECRET = secrets.ENCRYPTION_SECRET;
  // process.env.MAYA_PUBLIC_KEY = secrets.MAYA_PUBLIC_KEY;
  // process.env.MAYA_SECRET_KEY = secrets.MAYA_SECRET_KEY;
  // process.env.CHAT_ENCRYPTION_SECRET = secrets.CHAT_ENCRYPTION_SECRET;
  // process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = secrets.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  // process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL = secrets.GOOGLE_ANALYTICS_CLIENT_EMAIL;
  // process.env.GOOGLE_ANALYTICS_PRIVATE_KEY = secrets.GOOGLE_ANALYTICS_PRIVATE_KEY;
  // process.env.GOOGLE_ANALYTICS_PROPERTY_ID = secrets.GOOGLE_ANALYTICS_PROPERTY_ID;

  if (!token) {
    if (req.nextUrl.pathname.startsWith("/pages/system_admin") || req.nextUrl.pathname.startsWith("/pages/admin_login")) {
      return NextResponse.redirect(new URL("/pages/admin_login", req.url));
    }
    return NextResponse.redirect(new URL("/pages/auth/login", req.url));
  }

  try {
    const decoded = await verifyToken(token);
    console.log("Decoded Token:", decoded);

    if (!decoded) {
      if (req.nextUrl.pathname.startsWith("/pages/tenant")) {
        return NextResponse.redirect(new URL("/pages/auth/login", req.url));
      } else if (req.nextUrl.pathname.startsWith("/pages/landlord")) {
        return NextResponse.redirect(new URL("/pages/auth/login", req.url));
      } else {
        return NextResponse.redirect(new URL("/pages/auth/login", req.url));
      }
    }

    const { userType, role, permissions } = decoded;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith("/pages/tenant") && userType !== "tenant") {
      return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
    }

    if (pathname.startsWith("/pages/landlord") && userType !== "landlord") {
      return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
    }

    if (pathname.startsWith("/pages/system_admin")) {
      if (role !== "super-admin" && role !== "co-admin" && role !== "superadmin") {
        return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
      }

      if (excludePages.some(page => pathname.startsWith(page))) {
        return NextResponse.next();
      }

      if (!permissions || !Array.isArray(permissions)) {
        console.error("Permissions are missing or invalid for admin:", decoded);
        return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
      }

      const requiredPermissionKey = Object.keys(permissionMapping).find(key =>
          pathname.startsWith(key)
      );

      if (requiredPermissionKey) {
        const requiredPermission = permissionMapping[requiredPermissionKey];
        console.log("Required Permission:", requiredPermission);

        if (!permissions.includes(requiredPermission)) {
          console.error("Access Denied - Missing Permission:", requiredPermission);
          return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.redirect(new URL("/pages/admin_login", req.url));
  }
}

export const config = {
  matcher: [
    "/pages/tenant/:path*",
    "/pages/landlord/:path*",
    "/pages/system_admin/:path*",
    "/pages/commons/:path*",
  ],
};
