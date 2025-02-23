import { NextResponse } from "next/server";
import { jwtVerify } from "jose"; // Ensure you have 'jose' installed: npm install jose

// Function to verify JWT token
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

    const { userType, role } = decoded;
    const pathname = req.nextUrl.pathname;

    // Redirect based on role
    if (pathname.startsWith("/pages/tenant") && userType !== "tenant") {
      return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
    }

    if (pathname.startsWith("/pages/landlord") && userType !== "landlord") {
      return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
    }

    if (pathname.startsWith("/pages/system_admin") && role !== "super-admin") {
      return NextResponse.redirect(new URL("/pages/error/accessDenied", req.url));
    }

    return NextResponse.next();

  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.redirect(new URL("/pages/admin_login", req.url)); // Redirect if an error occurs
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
