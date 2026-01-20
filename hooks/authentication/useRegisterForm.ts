"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import useRoleStore from "@/zustand/store";
import { useRouter, useSearchParams } from "next/navigation";
import { logEvent } from "@/utils/gtag";
import Swal from "sweetalert2";

const registerSchema = z
    .object({
        firstName: z.string().min(1, "First Name is required"),
        lastName: z.string().min(1, "Last Name is required"),
        email: z.string().email("Invalid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .refine(
                (value) =>
                    /^[\w!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/.test(value),
                "Password contains invalid characters"
            ),
        confirmPassword: z.string().min(8, "Confirm Password must match password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const useRegisterForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = useRoleStore((state) => state.role);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role,
        timezone: "", // ✅ set by component
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const [focusedField, setFocusedField] = useState("");
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    const error_2 = searchParams.get("error");

    // ✅ Only sync role here
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            role,
        }));
    }, [role]);

    // ✅ EXPOSED timezone setter
    const setTimezone = (timezone: string) => {
        setFormData((prev) => ({
            ...prev,
            timezone,
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));

        if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
        if (error) setError("");
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAgreeToTerms(e.target.checked);
    };

    const handleGoogleSignup = () => {
        logEvent(
            "Login Attempt",
            "Google Sign-Up",
            "User Clicked Google Sign-Up",
            1
        );

        // ✅ Full page redirect (required for OAuth)
        window.location.href = `/api/auth/googleSignUp?userType=${role}`;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setError("");

        try {
            registerSchema.parse(formData);

            if (!agreeToTerms) {
                Swal.fire({
                    icon: "error",
                    title: "Terms Not Accepted",
                    text:
                        "You must agree to the Terms of Service and Privacy Policy before registering.",
                    confirmButtonText: "OK",
                });
                return;
            }

            setIsRegistering(true);

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                await Swal.fire({
                    title: "Success!",
                    text: "Account successfully registered! Redirecting...",
                    icon: "success",
                    confirmButtonText: "OK",
                });

                window.location.href = "/pages/auth/verify-email";
                return;
            }
            else if (data.error?.includes("already")) {
                Swal.fire({
                    icon: "error",
                    title: "Error!",
                    text: "This email is already registered. Please log in.",
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Registration Failed!",
                    text: data.error || "Please try again.",
                });
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                const errorObj = err.errors.reduce((acc, curr) => {
                    acc[curr.path[0]] = curr.message;
                    return acc;
                }, {} as Record<string, string>);
                setErrors(errorObj);
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Unexpected Error!",
                    text: "An unexpected error occurred. Please try again.",
                });
            }
        } finally {
            setIsRegistering(false);
        }
    };

    return {
        formData,
        errors,
        error,
        error_2,
        focusedField,
        setFocusedField,
        agreeToTerms,
        handleCheckboxChange,
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        isRegistering,
        handleChange,
        handleGoogleSignup,
        handleSubmit,
        setTimezone, // ✅ exposed to component
    };
};
