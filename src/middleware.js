import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; // Ensure you have 'jose' installed: npm install jose

// Function to verify JWT token during login.
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
  "/pages/system_admin/approve_properties": "approve_properties",
  "/pages/system_admin/manage_announcements": "manage_announcements",
  "/pages/system_admin/view_reports": "view_reports",
  "/pages/system_admin/handle_disputes": "handle_disputes",
};

const excludePages = [
  "/pages/system_admin/dashboard",
];



export async function middleware(req) {

  const token = req.cookies.get("token")?.value;

  if (!token) {
    if (req.nextUrl.pathname.startsWith("/pages/system_admin" || "/pages/admin_login")) {
      return NextResponse.redirect(new URL("/pages/admin_login", req.url));
    }

    return NextResponse.redirect(new URL("/pages/auth/login", req.url));
  }


  try {
    const decoded = await verifyToken(token);

    // if (!decoded) {
    //   return NextResponse.redirect(new URL("/pages/auth/admin_login", req.url)); // Redirect if invalid token
    // }

    const { userType, role,  permissions  } = decoded;
    const pathname = req.nextUrl.pathname;

    // Redirect based on role
    if (pathname.startsWith("/pages/tenant") && userType !== "tenant") {
      return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
    }

    if (pathname.startsWith("/pages/landlord") && userType !== "landlord") {
      return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
    }

    if (pathname.startsWith("/pages/system_admin")) {

      if (role !== "super-admin" && role !== "co-admin") {
        return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
      }

      if (excludePages.some(page => pathname.startsWith(page))) {
        return NextResponse.next(); //  pages that do no need permission access.
      }

      const requiredPermission = Object.entries(permissionMapping).find(([key]) =>
          pathname.startsWith(key)
      );

      if (requiredPermission && !permissions?.includes(requiredPermission[1])) {
        return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
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
