"use client";

import { useLoginForm } from "@/hooks/authentication/useLoginForm";
import ReCAPTCHA from "react-google-recaptcha";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef } from "react";

export default function MobileLoginForm() {
    const {
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
        handleSubmit,
    } = useLoginForm();

    const recaptchaRef = useRef<ReCAPTCHA>(null);

    /* 🔥 RESET INPUTS + CAPTCHA WHEN ERROR OCCURS (ERROR MESSAGE STAYS) */
    useEffect(() => {
        if (!errorMessage) return;

        const timer = setTimeout(() => {
            // Reset inputs (do NOT touch errorMessage)
            handleChange({ target: { name: "email", value: "" } } as any);
            handleChange({ target: { name: "password", value: "" } } as any);

            // Reset UI-only states
            setShowPassword(false);
            setRememberMe(false);

            // Regenerate reCAPTCHA
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
        }, 3000); // ⏱️ 3 seconds (adjust as needed)

        return () => clearTimeout(timer);
    }, [errorMessage]);


    return (
        <div className="w-full max-w-sm mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                {/* Header */}
                <div className="text-center mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Sign In</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Access your account</p>
                </div>

                {/* Error Message (UNCHANGED) */}
                {errorMessage && (
                    <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-xs text-red-700 text-center">
                            {errorMessage}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="juan@email.com"
                            disabled={isLoggingIn}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                outline-none transition-all disabled:bg-gray-50"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                disabled={isLoggingIn}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  outline-none transition-all disabled:bg-gray-50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoggingIn}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-1.5 text-gray-600">Remember me</span>
                        </label>
                        <Link href="./forgot-password" className="text-blue-600 hover:text-blue-700">
                            Forgot?
                        </Link>
                    </div>

                    {/* reCAPTCHA */}
                    <div className="flex justify-center transform scale-[0.85] origin-center -my-1">
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                            onChange={(token) => setCaptchaToken(token)}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoggingIn || !captchaToken}
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-emerald-600
              hover:from-blue-700 hover:to-emerald-700
              text-white font-semibold rounded-lg text-sm
              transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoggingIn ? "Signing in..." : "Sign In"}
                    </button>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogleSignin}
                        disabled={isLoggingIn}
                        className="w-full flex items-center justify-center gap-2 py-2
              bg-white border border-gray-300 rounded-lg text-sm
              hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
            <span className="text-gray-700 font-medium text-sm">
              Continue with Google
            </span>
                    </button>

                    {/* Sign Up */}
                    <div className="text-center text-xs text-gray-600 pt-1">
                        Don't have an account?{" "}
                        <Link href="../auth/selectRole" className="text-blue-600 hover:text-blue-700">
                            Create one
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
