import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; // Ensure you have 'jose' installed: npm install jose

// Function to verify JWT token during login.
// async function verifyToken(token) {
//   try {
//     const secret = new TextEncoder().encode(process.env.JWT_SECRET);
//     const { payload } = await jwtVerify(token, secret);
//     return payload;
//   } catch (error) {
//     console.error("Token verification failed:", error);
//     return null;
//   }
// }
//
// const permissionMapping = {
//   "/pages/system_admin/co_admin": "manage_users",
//   "/pages/system_admin/propertyManagement": "approve_properties",
//   "/pages/system_admin/annoucement": "manage_announcements",
//   "/pages/system_admin/bug_report": "view_reports",
//   "/pages/system_admin/activiyLog": "view_log",
//   "/pages/system_admin/tenant_landlord": "tenant_landlord_management",
// };
//
// const excludePages = [
//   "/pages/system_admin/dashboard",
//   "/pages/system_admin/profile",
//
// ];
//
// export async function middleware(req) {
//
//   const token = req.cookies.get("token")?.value;
//
//   if (!token) {
//     if (req.nextUrl.pathname.startsWith("/pages/system_admin" || "/pages/admin_login")) {
//       return NextResponse.redirect(new URL("/pages/admin_login", req.url));
//     }
//
//     return NextResponse.redirect(new URL("/pages/auth/login", req.url));
//   }
//
//
//   try {
//     const decoded = await verifyToken(token);
//
//     // if (!decoded) {
//     //   return NextResponse.redirect(new URL("/pages/auth/admin_login", req.url)); // Redirect if invalid token
//     // }
//
//     const { userType, role,  permissions  } = decoded;
//     const pathname = req.nextUrl.pathname;
//
//     // Redirect based on role
//     if (pathname.startsWith("/pages/tenant") && userType !== "tenant") {
//       return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
//     }
//
//     if (pathname.startsWith("/pages/landlord") && userType !== "landlord") {
//       return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
//     }
//
//     if (pathname.startsWith("/pages/system_admin")) {
//
//       if (role !== "super-admin" && role !== "co-admin") {
//         return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
//       }
//
//       if (excludePages.some(page => pathname.startsWith(page))) {
//         return NextResponse.next(); //  pages that do no need permission access.
//       }
//
//       const requiredPermission = Object.entries(permissionMapping).find(([key]) =>
//           pathname.startsWith(key)
//       );
//
//       if (requiredPermission && !permissions?.includes(requiredPermission[1])) {
//         return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
//       }
//
//     }
//
//
//     return NextResponse.next();
//
//   } catch (error) {
//     console.error("Token verification failed:", error);
//     return NextResponse.redirect(new URL("/pages/admin_login", req.url));
//   }
// }
//
// export const config = {
//   matcher: [
//     "/pages/tenant/:path*",
//     "/pages/landlord/:path*",
//     "/pages/system_admin/:path*",
//     "/pages/commons/:path*",
//   ],
// };


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

// Define permission mapping for system_admin routes
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
];

export async function middleware(req) {
  const token = req.cookies.get("token")?.value;

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
      return NextResponse.redirect(new URL("/pages/admin_login", req.url));
    }

    const { userType, role, permissions } = decoded;
    const pathname = req.nextUrl.pathname;

    // Redirect based on role
    if (pathname.startsWith("/pages/tenant") && userType !== "tenant") {
      return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
    }

    if (pathname.startsWith("/pages/landlord") && userType !== "landlord") {
      return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
    }

    // ✅ Only check permissions for system_admin pages
    if (pathname.startsWith("/pages/system_admin")) {
      if (role !== "super-admin" && role !== "co-admin") {
        return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
      }

      // Allow access to pages that do not require permission checks
      if (excludePages.some(page => pathname.startsWith(page))) {
        return NextResponse.next();
      }

      // Ensure permissions exist before checking
      if (!permissions || !Array.isArray(permissions)) {
        console.error("Permissions are missing or invalid for admin:", decoded);
        return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
      }

      // Get required permission for this route
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
