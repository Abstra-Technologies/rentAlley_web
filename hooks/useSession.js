"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// This is for Sessions jwt w/o cookies
// export default function useAuth() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const router = useRouter();
//
//   useEffect(() => {
//     const verifyToken = async () => {
//       const token = sessionStorage.getItem("token");
//
//       if (!token) {
//         setError("No token found. Please log in.");
//         setLoading(false);
//         await router.push("/pages/auth/login");
//         return;
//       }
//
//       try {
//         const response = await fetch("/api/auth/verify-token", {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });
//
//         if (!response.ok) {
//           new Error("Token verification failed");
//         }
//
//         const data = await response.json();
//         setUser(data.user);
//         setLoading(false);
//       } catch (error) {
//         setError(error.message);
//         setLoading(false);
//         await router.push("/pages/auth/login");
//       }
//     };
//
//     verifyToken();
//   }, [router]);
//
//   const signOut = () => {
//     sessionStorage.removeItem("token");
//     setUser(null);
//     router.push("/pages/auth/login");
//   };
//
//   return { user, loading, error, signOut };
// }

//cookies

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const verifySession = async () => {
      try {
        // Fetch user session from the backend
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", // Include HTTP-only cookies
        });

        if (!response.ok) {
          new Error("Failed to verify session. Please log in.");
        }

        const data = await response.json();
        setUser(data);
        setLoading(false);
      } catch (error) {
        console.error("Session verification failed:", error);
        setError(error.message);
        setLoading(false);
        await router.push("/pages/auth/login");
      }
    };

    verifySession();
  }, [router]);

  const signOut = async () => {
    try {
      // Call logout endpoint to clear the session on the backend
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Ensure cookies are included
      });
      setUser(null);
      router.push("/pages/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  return { user, loading, error, signOut };
}