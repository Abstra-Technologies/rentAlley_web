

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
