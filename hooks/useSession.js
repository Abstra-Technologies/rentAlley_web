//
// "use client";
//
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { jwtVerify } from "jose";
// import {decryptData} from "@/src/pages/crypto/encrypt";
//
// export default function useAuth() {
//   const [user, setUser] = useState(null);
//   const [admin, setAdmin] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const router = useRouter();
//
//
//   const decryptUserData = (data) => {
//     console.log("ENCRYPTION_SECRET:", process.env.ENCRYPTION_SECRET);
//     const encryptionKey = process.env.ENCRYPTION_SECRET;
//
//     if (!encryptionKey) {
//       console.error("Missing ENCRYPTION_SECRET in environment variables.");
//       return data;
//     }
//
//     return {
//       user_id: data.user_id,
//       firstName: decryptData(JSON.parse(data.firstName), encryptionKey),
//       lastName: decryptData(JSON.parse(data.lastName), encryptionKey),
//       email: decryptData(JSON.parse(data.email), encryptionKey),
//       profilePicture: data.profilePicture,
//       tenant_id: data.tenant_id || null,
//       userType: data.userType || null,
//       landlord_id: data.landlord_id || null,
//       is_trial_used: data.landlord_id ? data.is_trial_used || false : null,
//       subscription: data.subscription
//           ? {
//             subscription_id: data.subscription.id || null,
//             plan_name: data.subscription.plan_name,
//             status: data.subscription.status,
//             start_date: data.subscription.start_date,
//             end_date: data.subscription.end_date,
//             payment_status: data.subscription.payment_status,
//           }
//           : null,
//     };
//   };
//
//   const decryptAdminData = (data) => {
//     // console.log("ENCRYPTION_SECRET:", process.env.ENCRYPTION_SECRET);
//     // const encryptionKey = process.env.ENCRYPTION_SECRET;
//     //
//     // if (!encryptionKey) {
//     //   console.error("Missing ENCRYPTION_SECRET in environment variables.");
//     //   return data;
//     // }
//
//     return {
//       admin_id: data.admin_id,
//       username:data.username,
//       email: data.email,
//       role: data.role,
//       status: data.status,
//       profilePicture: data.profilePicture,
//
//     };
//   };
//
//   useEffect(() => {
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
//         // if (!response.ok) {
//         //   throw new Error("Session verification failed. Please log in.");
//         // }
//
//         const data = await response.json();
//
//         if (data.admin_id) {
//           setAdmin(decryptAdminData(data));
//           setUser(null); // Ensure only one type is set
//         }
//         if (data.user_id) {
//           setUser(decryptUserData(data));
//           setAdmin(null);
//         }
//         setLoading(false);
//         router.refresh();
//       } catch (error) {
//         console.error("Session verification failed:", error);
//         setError(error.message);
//         setLoading(false);
//
//         // 🔹 FIX: Avoid relying on `admin` state for redirection
//         // router.push("/pages/auth/login"); // Default redirect for unauthenticated users
//       }
//     };
//
//     verifySession();
//   }, [router]);
//
//   const signOut = async () => {
//     try {
//       const logoutResponse = await fetch("/api/auth/logout", {
//         method: "POST",
//         credentials: "include",
//       });
//       if (!logoutResponse.ok) {
//         throw new Error("Failed to log out on the server.");
//       }
//       const logResponse = await fetch("/api/activityLogs/signoutLogs", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           user_id: user?.user_id,
//           action: "User signed out",
//           timestamp: new Date().toISOString(),
//         }),
//       });
//       if (!logResponse.ok) {
//         console.error("Failed to log sign-out activity.");
//       }
//       setUser(null);
//       router.push("/pages/auth/login");
//     } catch (error) {
//       console.error("Logout failed:", error);
//       setError("Failed to log out. Please try again.");
//     }
//   };
//   const signOutAdmin = async () => {
//     try {
//       const logoutResponse = await fetch("/api/auth/logout", {
//         method: "POST",
//         credentials: "include",
//       });
//       if (!logoutResponse.ok) {
//          new Error("Failed to log out on the server.");
//       }
//       const logResponse = await fetch("/api/activityLogs/signoutLogs_admin", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           admin_id: admin?.admin_id,
//           action: "Admin signed out",
//           timestamp: new Date().toISOString(),
//         }),
//       });
//       if (!logResponse.ok) {
//         console.error("Failed to log sign-out activity.");
//       }
//       setAdmin(null);
//       router.push( "/pages/admin_login");
//     } catch (error) {
//       console.error("Logout failed:", error);
//       setError("Failed to log out. Please try again.");
//     }
//   };
//
//
//   return { user, admin, loading, error, signOut, signOutAdmin };
// }
//

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "../src/pages/zustand/authStore";

export default function useAuth() {
  const { user, admin, loading, fetchSession, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchSession();

    const handleAuthChange = () => fetchSession();
    window.addEventListener("authChange", handleAuthChange);

    return () => window.removeEventListener("authChange", handleAuthChange);
  }, []);

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      logout();
      window.dispatchEvent(new Event("authChange")); // Notify components
      router.push("/pages/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const signOutAdmin = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      logout();
      window.dispatchEvent(new Event("authChange"));
      router.push("/pages/admin_login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return { user, admin, loading, signOut, signOutAdmin };
}
