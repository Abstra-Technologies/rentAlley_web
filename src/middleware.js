import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req) {
  const token = req.cookies.get("token"); // Check cookies for the token

  if (!token) {
    return NextResponse.redirect(new URL("/pages/auth/login", req.url)); // Redirect to login if no token
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token using your secret key

    // Optionally, verify user type based on the route
    const { userType } = decoded; // Assuming token contains userType
    const pathname = req.nextUrl.pathname;

    if (
      (pathname.startsWith("/pages/tenant") && userType !== "tenant") ||
      (pathname.startsWith("/pages/landlord") && userType !== "landlord") ||
      (pathname.startsWith("/pages/system_admin") && userType !== "admin")
    ) {
      return NextResponse.redirect(new URL("/pages/auth/login", req.url)); // Redirect if user type doesn't match
    }

    return NextResponse.next(); // Proceed to the next middleware or route
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.redirect(new URL("/pages/auth/login", req.url)); // Redirect if token is invalid
  }
}

export const config = {
  matcher: [
    "/pages/tenant/:path*", // Protect all routes under /tenant
    "/pages/landlord/:path*", // Protect all routes under /landlord
    "/pages/system_admin/:path*", // Protect all routes under /system_admin
  ],
};
