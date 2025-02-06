
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {jwtVerify} from "jose";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const refreshToken = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include", // Ensure cookies are included
      });

      if (!response.ok) {
        throw new Error("Failed to refresh session. Please log in again.");
      }

      const data = await response.json();
      setUser(data); // Update the user data
    } catch (error) {
      console.error("Token refresh failed:", error);
      setError(error.message);
      router.push("/pages/auth/login"); // Redirect to login page
    }
  };
  const verifyToken = async (token) => {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      return payload;
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  };
  // Verify user session
  useEffect(() => {
    const verifySession = async () => {
      try {
        setLoading(true);

        // Fetch user session from the backend
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", // Include HTTP-only cookies
        });

        if (!response.ok) {
          throw new Error("Session verification failed. Please log in.");
        }

        const data = await response.json();
        setUser(data); // Set the user data
        setLoading(false);

        if (data?.token) {
          const decoded = await verifyToken(data.token);
          if (decoded) {
            const expiresAt = decoded.exp * 1000; // Convert to milliseconds
            const now = Date.now();

            // Refresh token 1 min before expiration
            const refreshTime = expiresAt - now - 60000;
            if (refreshTime > 0) {
              setTimeout(refreshToken, refreshTime);
            } else {
              await refreshToken();
            }
          }
        }

      } catch (error) {
        console.error("Session verification failed:", error);
        setError(error.message);
        setLoading(false);

        if (user?.role === "admin") {
          router.push("/pages/system_admin/login"); // Admin login page
        } else {
          router.push("/pages/auth/login"); // Regular user login page
        }
      }
    };

    verifySession();
  }, [router]);

  // Sign out the user
  const signOut = async () => {
    try {
      // Call logout endpoint to clear the session on the backend
      const logoutResponse = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Ensure cookies are included
      });

      if (!logoutResponse.ok) {
         new Error("Failed to log out on the server.");
      }

      // Log user sign-out activity
      const logResponse = await fetch("/api/activityLogs/signoutLogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user?.user_id,
          action: "User signed out",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!logResponse.ok) {
        console.error("Failed to log sign-out activity.");
      }

      setUser(null); // Clear user state
      router.push("/pages/auth/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  const signOut_admin = async () => {
    try {
      // Call logout endpoint to clear the session on the backend
      const logoutResponse = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Ensure cookies are included
      });

      if (!logoutResponse.ok) {
        new Error("Failed to log out on the server.");
      }

      // Log user sign-out activity
      const logResponse = await fetch("/api/activityLogs/signoutLogs_admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin_id: user?.admin_id,
          action: "Admin signed out",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!logResponse.ok) {
        console.error("Failed to log sign-out activity.");
      }

      setUser(null); // Clear user state
      router.push("/pages/system_admin/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  return { user, loading, error, signOut, signOut_admin };
}
