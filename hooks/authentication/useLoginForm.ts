"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import useAuthStore from "@/zustand/authStore";
import { logEvent } from "@/utils/gtag";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export function useLoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, fetchSession } = useAuthStore();
    const errorParam = searchParams.get("error");

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        if (user) {
            if (user.userType === "tenant") router.replace("/pages/tenant/feeds");
            else if (user.userType === "landlord") router.replace("/pages/landlord/dashboard");
            else router.replace("/");
        } else fetchSession();
    }, [user, router]);

    useEffect(() => {
        sessionStorage.removeItem("pending2FA");
        window.history.replaceState(null, "", "/pages/auth/login");
    }, [user]);

    useEffect(() => {
        if (errorParam) setErrorMessage("Authentication failed. Please try again.");
    }, [errorParam]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (errorMessage) setErrorMessage("");
    };

    const handleGoogleSignin = async () => {
        setIsLoggingIn(true);
        setErrorMessage("");
        try {
            logEvent("Login Attempt", "Google Sign-In", "User Clicked Google Login", 1);
            router.push("/api/auth/google-login");
        } catch (err: any) {
            console.error(err);
            setErrorMessage("Google sign-in failed. Please try again.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            loginSchema.parse(formData);
        } catch {
            setErrorMessage("Please fill in valid credentials.");
            return;
        }

        if (!captchaToken) {
            setErrorMessage("Please verify you're not a robot.");
            return;
        }

        setIsLoggingIn(true);
        setErrorMessage("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, captchaToken, rememberMe }),
                credentials: "include",
            });
            const data = await res.json();
            if (res.ok) {
                if (data.requires_otp) router.push(`/pages/auth/verify-2fa?user_id=${data.user_id}`);
                else {
                    await fetchSession();
                    if (data.redirectUrl) router.replace(data.redirectUrl);
                }
            } else {
                setErrorMessage(data.error || "Invalid credentials");
                if (window.grecaptcha) window.grecaptcha.reset();
                setCaptchaToken(null);
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Something went wrong. Please try again.");
            if (window.grecaptcha) window.grecaptcha.reset();
            setCaptchaToken(null);
        } finally {
            setIsLoggingIn(false);
        }
    };

    return {
        formData,
        showPassword,
        setShowPassword,
        errorMessage,
        isLoggingIn,
        captchaToken,
        setCaptchaToken,
        rememberMe,
        setRememberMe,
        handleChange,
        handleGoogleSignin,
        handleSubmit
    };
}
