// import { NextResponse } from "next/server";
// import { jwtVerify } from "jose";
//
// async function verifyToken(token) {
//   try {
//     const secret = new TextEncoder().encode(process.env.JWT_SECRET); // Use TextEncoder for Edge Runtime compatibility
//     const { payload } = await jwtVerify(token, secret); // Verify and decode the token
//     return payload; // Return the decoded payload
//   } catch (error) {
//     console.error("Token verification failed:", error);
//     return null; // Return null if verification fails
//   }
// }
//
//
// export async function middleware(req) {
//   const token = req.cookies.get("token")?.value;
//
//   if (!token) {
//     return NextResponse.redirect(new URL("/pages/auth/admin_login", req.url));
//   }
//   try {
//     const decoded = await verifyToken(token);
//     const { userType } = decoded;
//     const pathname = req.nextUrl.pathname;
//
//     if (
//       (pathname.startsWith("/pages/tenant") && userType !== "tenant") ||
//       (pathname.startsWith("/landlord") && userType !== "landlord") ||
//       (pathname.startsWith("/pages/system_admin") && userType !== "admin")
//     ) {
//       return NextResponse.redirect(new URL("/pages/auth/admin_login", req.url)); // Redirect if user type doesn't match
//     }
//
//     return NextResponse.next();
//   } catch (error) {
//     console.error("Token verification failed:", error);
//     return NextResponse.redirect(new URL("/pages/auth/admin_login", req.url)); // Redirect if token is invalid
//   }
// }
//
// export const config = {
//   matcher: [
//     "/pages/tenant/:path*", // Protect all routes under /tenant
//     "/pages/landlord/:path*", // Protect all routes under /landlord
//     "/system_admin/:path*", // Protect all routes under /system_admin
//   ],
// };

import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; // Ensure you have 'jose' installed: npm install jose

// Function to verify JWT token
async function verifyToken(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET); // Encode for Edge compatibility
    const { payload } = await jwtVerify(token, secret); // Decode token
    return payload; // Return decoded payload
  } catch (error) {
    console.error("Token verification failed:", error);
    return null; // Return null if verification fails
  }
}

export async function middleware(req) {

  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/pages/auth/admin_login", req.url)); // Redirect if no token
  }

  try {
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.redirect(new URL("/pages/auth/admin_login", req.url)); // Redirect if invalid token
    }

    const { userType, role } = decoded; // Extract userType (for tenants/landlords) and role (for admin)
    const pathname = req.nextUrl.pathname;

    // Redirect based on role
    if (pathname.startsWith("/pages/tenant") && userType !== "tenant") {
      return NextResponse.redirect(new URL("/pages/auth/admin_login", req.url));
    }

    if (pathname.startsWith("/pages/landlord") && userType !== "landlord") {
      return NextResponse.redirect(new URL("/pages/auth/admin_login", req.url));
    }

    if (pathname.startsWith("/pages/system_admin") && role !== "super-admin") {
      return NextResponse.redirect(new URL("/pages/system_admin/login", req.url));
    }

    return NextResponse.next(); // Allow access if role matches

  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.redirect(new URL("/pages/auth/admin_login", req.url)); // Redirect if an error occurs
  }
}

// Middleware applies only to these routes
export const config = {
  matcher: [
    "/pages/tenant/:path*",   // Protect tenant routes
    "/pages/landlord/:path*", // Protect landlord routes
    "/pages/system_admin/:path*", // Protect admin routes
  ],
};
