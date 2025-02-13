
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtVerify } from "jose";
import {decryptData} from "@/src/pages/crypto/encrypt";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();


  const decryptUserData = (data) => {
    console.log("ENCRYPTION_SECRET:", process.env.ENCRYPTION_SECRET);
    const encryptionKey = process.env.ENCRYPTION_SECRET;

    if (!encryptionKey) {
      console.error("Missing ENCRYPTION_SECRET in environment variables.");
      return data;
    }

    return {
      user_id: data.user_id,
      firstName: decryptData(JSON.parse(data.firstName), encryptionKey),
      lastName: decryptData(JSON.parse(data.lastName), encryptionKey),
      email: decryptData(JSON.parse(data.email), encryptionKey),
      profilePicture: data.profilePicture,
      tenant_id: data.tenant_id || null,
      userType: data.userType || null,
      landlord_id: data.landlord_id || null,
      is_trial_used: data.landlord_id ? data.is_trial_used || false : null,
      subscription: data.subscription
          ? {
            subscription_id: data.subscription.id || null,
            plan_name: data.subscription.plan_name,
            status: data.subscription.status,
            start_date: data.subscription.start_date,
            end_date: data.subscription.end_date,
            payment_status: data.subscription.payment_status,
          }
          : null,
    };
  };

  // Function to decrypt admin data
  const decryptAdminData = (data) => {
    // console.log("ENCRYPTION_SECRET:", process.env.ENCRYPTION_SECRET);
    // const encryptionKey = process.env.ENCRYPTION_SECRET;
    //
    // if (!encryptionKey) {
    //   console.error("Missing ENCRYPTION_SECRET in environment variables.");
    //   return data;
    // }

    return {
      admin_id: data.admin_id,
      username:data.username,
      email: data.email,
      role: data.role,
      status: data.status,
      profilePicture: data.profilePicture,

    };
  };

  // Verify user session
//   useEffect(() => {
//
//
//     const verifySession = async () => {
//       try {
//         setLoading(true);
//
//         // Fetch user session from the backend
//         const response = await fetch("/api/auth/me", {
//           method: "GET",
//           credentials: "include", // Include HTTP-only cookies
//         });
//
//         if (!response.ok) {
//           throw new Error("Session verification failed. Please log in.");
//         }
// // router.refresh();
//         const data = await response.json();
//
//         if (data.admin_id) {
//           setAdmin(decryptAdminData(data));
//         } else {
//           setUser(decryptUserData(data));
//         }
//
//         setLoading(false);
//
//         if (data?.token) {
//           const decoded = await verifyToken(data.token);
//           if (decoded) {
//             const expiresAt = decoded.exp * 1000; // Convert to milliseconds
//             const now = Date.now();
//
//             // Refresh token 1 min before expiration
//             const refreshTime = expiresAt - now - 60000;
//             if (refreshTime > 0) {
//               setTimeout(refreshToken, refreshTime);
//             } else {
//               await refreshToken();
//             }
//           }
//         }
//       } catch (error) {
//         console.error("Session verification failed:", error);
//         setError(error.message);
//         setLoading(false);
//
//
//
//         const token = document.cookie.includes("token");
//         if (token) {
//           router.push("/pages/admin_login"); // Admin admin_login page
//         }
//
//         router.push("/pages/auth/login"); // Regular user admin_login page
//
//       }
//     };
//
//     verifySession();
//   }, [router]);

  useEffect(() => {
    const verifySession = async () => {
      try {
        setLoading(true);

        // Fetch user session from the backend
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", // Include HTTP-only cookies
        });

        // if (!response.ok) {
        //   throw new Error("Session verification failed. Please log in.");
        // }

        const data = await response.json();

        // ✅ Correctly update state based on user type
        if (data.admin_id) {
          setAdmin(decryptAdminData(data));
          setUser(null); // Ensure only one type is set
        }

        if (data.user_id) {
          setUser(decryptUserData(data));
          setAdmin(null);
          router.push("/pages/auth/login");
        }
        setLoading(false);
      } catch (error) {
        console.error("Session verification failed:", error);
        setError(error.message);
        setLoading(false);

        // 🔹 FIX: Avoid relying on `admin` state for redirection
        // router.push("/pages/auth/login"); // Default redirect for unauthenticated users
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
        throw new Error("Failed to log out on the server.");
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
      router.push("/pages/auth/login"); // Redirect to admin_login page
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  const signOutAdmin = async () => {
    try {
      const logoutResponse = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!logoutResponse.ok) {
         new Error("Failed to log out on the server.");
      }

      // Log admin sign-out activity
      const logResponse = await fetch("/api/activityLogs/signoutLogs_admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin_id: admin?.admin_id,
          action: "Admin signed out",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!logResponse.ok) {
        console.error("Failed to log sign-out activity.");
      }

      setAdmin(null); // Clear admin state
      router.push( "/pages/admin_login");
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  return { user, admin, loading, error, signOut, signOutAdmin };
}