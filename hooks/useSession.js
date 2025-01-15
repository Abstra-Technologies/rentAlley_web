'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const verifyToken = async () => {
            const token = sessionStorage.getItem("token");

            if (!token) {
                setError("No token found. Please log in.");
                setLoading(false);
                await router.push("/auth/login");
                return;
            }

            try {
                const response = await fetch("/api/auth/verify-token", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    new Error("Token verification failed");
                }

                const data = await response.json();
                setUser(data.user);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
                await router.push("/pages/auth/login");
            }
        };

        verifyToken();
    }, [router]);

    const signOut = () => {
        sessionStorage.removeItem("token");
        setUser(null);
        router.push("/pages/auth/login");
    };


    return { user, loading, error, signOut };
}