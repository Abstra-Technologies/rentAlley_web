//
// "use client";
//
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import {jwtVerify} from "jose";
//
// export default function useAuth() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const router = useRouter();
//
//   const refreshToken = async () => {
//     try {
//       const response = await fetch("/api/auth/refresh", {
//         method: "POST",
//         credentials: "include", // Ensure cookies are included
//       });
//
//       if (!response.ok) {
//         throw new Error("Failed to refresh session. Please log in again.");
//       }
//
//       const data = await response.json();
//       setUser(data); // Update the user data
//     } catch (error) {
//       console.error("Token refresh failed:", error);
//       setError(error.message);
//       router.push("/pages/auth/login"); // Redirect to login page
//     }
//   };
//   const verifyToken = async (token) => {
//     try {
//       const secret = new TextEncoder().encode(process.env.JWT_SECRET);
//       const { payload } = await jwtVerify(token, secret);
//       return payload;
//     } catch (error) {
//       console.error("Token verification failed:", error);
//       return null;
//     }
//   };
//   // Verify user session
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
//         if (!response.ok) {
//           throw new Error("Session verification failed. Please log in.");
//         }
//
//         const data = await response.json();
//         setUser(data); // Set the user data
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
//
//       } catch (error) {
//         console.error("Session verification failed:", error);
//         setError(error.message);
//         setLoading(false);
//
//         if (user?.role === "admin") {
//           router.push("/pages/system_admin/login"); // Admin login page
//         } else {
//           router.push("/pages/auth/login"); // Regular user login page
//         }
//       }
//     };
//
//     verifySession();
//   }, [router]);
//
//   // Sign out the user
//   const signOut = async () => {
//     try {
//       // Call logout endpoint to clear the session on the backend
//       const logoutResponse = await fetch("/api/auth/logout", {
//         method: "POST",
//         credentials: "include", // Ensure cookies are included
//       });
//
//       if (!logoutResponse.ok) {
//          new Error("Failed to log out on the server.");
//       }
//
//       // Log user sign-out activity
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
//
//       if (!logResponse.ok) {
//         console.error("Failed to log sign-out activity.");
//       }
//
//       setUser(null); // Clear user state
//       router.push("/pages/auth/login"); // Redirect to login page
//     } catch (error) {
//       console.error("Logout failed:", error);
//       setError("Failed to log out. Please try again.");
//     }
//   };
//
//   const signOut_admin = async () => {
//     try {
//       // Call logout endpoint to clear the session on the backend
//       const logoutResponse = await fetch("/api/auth/logout", {
//         method: "POST",
//         credentials: "include", // Ensure cookies are included
//       });
//
//       if (!logoutResponse.ok) {
//         new Error("Failed to log out on the server.");
//       }
//
//       // Log user sign-out activity
//       const logResponse = await fetch("/api/activityLogs/signoutLogs_admin", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           admin_id: user?.admin_id,
//           action: "Admin signed out",
//           timestamp: new Date().toISOString(),
//         }),
//       });
//
//       if (!logResponse.ok) {
//         console.error("Failed to log sign-out activity.");
//       }
//
//       setUser(null); // Clear user state
//       router.push("/pages/system_admin/login"); // Redirect to login page
//     } catch (error) {
//       console.error("Logout failed:", error);
//       setError("Failed to log out. Please try again.");
//     }
//   };
//
//   return { user, loading, error, signOut, signOut_admin };
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtVerify } from "jose";
import {decryptData} from "@/src/pages/crypto/encrypt";

// export default function useAuth() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const router = useRouter();
//
//   const refreshToken = async () => {
//     try {
//       const response = await fetch("/api/auth/refresh", {
//         method: "POST",
//         credentials: "include", // Ensure cookies are included
//       });
//
//       if (!response.ok) {
//         throw new Error("Failed to refresh session. Please log in again.");
//       }
//
//       const data = await response.json();
//       setUser(decryptUserData(data)); // Decrypt and update user data
//     } catch (error) {
//       console.error("Token refresh failed:", error);
//       setError(error.message);
//       router.push("/pages/auth/login"); // Redirect to login page
//     }
//   };
//
//   const verifyToken = async (token) => {
//     try {
//       const secret = new TextEncoder().encode(process.env.JWT_SECRET);
//       const { payload } = await jwtVerify(token, secret);
//       return payload;
//     } catch (error) {
//       console.error("Token verification failed:", error);
//       return null;
//     }
//   };
//
//   // Function to decrypt user data
//   const decryptUserData = (data) => {
//     console.log("ENCRYPTION_SECRET:", process.env.ENCRYPTION_SECRET);
//     const encryptionKey = process.env.ENCRYPTION_SECRET;
//
//     if (!encryptionKey) {
//       console.error("Missing ENCRYPTION_SECRET in environment variables.");
//       return data;
//     }
//
//     if (data.userType === "admin") {
//       return {
//         admin_id: data.admin_id,
//         username: decryptData(data.username, encryptionKey),
//         email: data.email,
//         role: data.role,
//         status: data.status,
//         userType: "admin",
//       };
//     } else {
//       return {
//         user_id: data.user_id,
//         firstName: decryptData(JSON.parse(data.firstName), encryptionKey),
//         lastName: decryptData(JSON.parse(data.lastName), encryptionKey),
//         email: decryptData(JSON.parse(data.email), encryptionKey),
//         userType: data.userType,
//         tenant_id: data.tenant_id || null,
//         landlord_id: data.landlord_id || null,
//       };
//     }
//   };
//
//   // Verify user session
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
//         if (!response.ok) {
//           throw new Error("Session verification failed. Please log in.");
//         }
//
//         const data = await response.json();
//         setUser(decryptUserData(data)); // Decrypt data before storing
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
//         if (user?.userType === "admin") {
//           router.push("/pages/system_admin/login"); // Admin login page
//         } else {
//           router.push("/pages/auth/login"); // Regular user login page
//         }
//       }
//     };
//
//     verifySession();
//   }, [router]);
//
//   // Sign out the user
//   const signOut = async () => {
//     try {
//       // Call logout endpoint to clear the session on the backend
//       const logoutResponse = await fetch("/api/auth/logout", {
//         method: "POST",
//         credentials: "include", // Ensure cookies are included
//       });
//
//       if (!logoutResponse.ok) {
//         throw new Error("Failed to log out on the server.");
//       }
//
//       // Log user sign-out activity
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
//
//       if (!logResponse.ok) {
//         console.error("Failed to log sign-out activity.");
//       }
//
//       setUser(null); // Clear user state
//       router.push("/pages/auth/login"); // Redirect to login page
//     } catch (error) {
//       console.error("Logout failed:", error);
//       setError("Failed to log out. Please try again.");
//     }
//   };
//
//   const signOut_admin = async () => {
//     try {
//       // Call logout endpoint to clear the session on the backend
//       const logoutResponse = await fetch("/api/auth/logout", {
//         method: "POST",
//         credentials: "include", // Ensure cookies are included
//       });
//
//       if (!logoutResponse.ok) {
//          new Error("Failed to log out on the server.");
//       }
//
//       // Log admin sign-out activity
//       const logResponse = await fetch("/api/activityLogs/signoutLogs_admin", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           admin_id: user?.admin_id,
//           action: "Admin signed out",
//           timestamp: new Date().toISOString(),
//         }),
//       });
//
//       if (!logResponse.ok) {
//         console.error("Failed to log sign-out activity.");
//       }
//
//       setUser(null); // Clear user state
//       router.push("/pages/system_admin/login"); // Redirect to admin login page
//     } catch (error) {
//       console.error("Logout failed:", error);
//       setError("Failed to log out. Please try again.");
//     }
//   };
//
//   return { user, loading, error, signOut, signOut_admin };
// }

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
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
      if (data.admin_id) {
        setAdmin(decryptAdminData(data));
      } else {
        setUser(decryptUserData(data));
      }
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

  // Function to decrypt user data
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
      tenant_id: data.tenant_id || null,
      userType: data.userType || null,
      landlord_id: data.landlord_id || null,
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
    };
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

        if (data.admin_id) {
          setAdmin(decryptAdminData(data));
        } else {
          setUser(decryptUserData(data));
        }

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

        if (admin) {
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
      router.push("/pages/auth/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  const signOutAdmin = async () => {
    try {
      // Call logout endpoint to clear the session on the backend
      const logoutResponse = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Ensure cookies are included
      });

      if (!logoutResponse.ok) {
        throw new Error("Failed to log out on the server.");
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
      router.push("/pages/system_admin/login"); // Redirect to admin login page
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Failed to log out. Please try again.");
    }
  };

  return { user, admin, loading, error, signOut, signOutAdmin };
}