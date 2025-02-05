
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

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
      } catch (error) {
        console.error("Session verification failed:", error);
        setError(error.message);
        setLoading(false);
        router.push("/pages/auth/login"); // Redirect to login page
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

  return { user, loading, error, signOut };
}
