"use client";

import { useLoginForm } from "@/hooks/authentication/useLoginForm";
import ReCAPTCHA from "react-google-recaptcha";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm({
                                      callbackUrl,
                                  }: {
    callbackUrl?: string | null;
}) {
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
    } = useLoginForm({ callbackUrl }); // ✅ THIS LINE FIXES EVERYTHING

    return (
        <div className="w-full max-w-sm">
            {/* Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                {/* Error Message */}
                {errorMessage && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm text-red-700 text-center">{errorMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="juan@email.com"
                            disabled={isLoggingIn}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                disabled={isLoggingIn}
                                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
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

                    {/* Remember Me + Forgot */}
                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-600">Remember me</span>
                        </label>
                        <Link
                            href="./forgot-password"
                            className="text-blue-600 hover:text-blue-700"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {/* reCAPTCHA */}
                    <div className="flex justify-center">
                        <ReCAPTCHA
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                            onChange={(token) => setCaptchaToken(token)}
                            theme="light"
                        />
                    </div>

                    {/* Sign In Button */}
                    <button
                        type="submit"
                        disabled={isLoggingIn || !captchaToken}
                        className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600
              hover:from-blue-700 hover:to-emerald-700
              text-white font-semibold rounded-lg text-sm
              transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoggingIn ? "Signing in..." : "Sign In"}
                    </button>

                    {/* Google Sign In */}
                    <button
                        type="button"
                        onClick={handleGoogleSignin}
                        disabled={isLoggingIn}
                        className="w-full flex items-center justify-center gap-3 py-2.5
    bg-white border border-gray-300 rounded-lg text-sm
    hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        {/* Google Icon */}
                        <svg
                            className="w-5 h-5"
                            viewBox="0 0 48 48"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fill="#EA4335"
                                d="M24 9.5c3.54 0 6.71 1.23 9.21 3.24l6.85-6.85C35.9 2.09 30.47 0 24 0 14.62 0 6.48 5.38 2.56 13.22l7.98 6.19C12.43 13.27 17.74 9.5 24 9.5z"
                            />
                            <path
                                fill="#4285F4"
                                d="M46.1 24.5c0-1.64-.15-3.21-.43-4.74H24v9h12.45c-.54 2.9-2.18 5.36-4.64 7.04l7.13 5.53C43.9 37.24 46.1 31.45 46.1 24.5z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M10.54 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"
                            />
                            <path
                                fill="#34A853"
                                d="M24 48c6.48 0 11.9-2.14 15.87-5.8l-7.13-5.53c-1.98 1.33-4.51 2.12-8.74 2.12-6.26 0-11.57-3.77-13.46-8.91l-7.98 6.19C6.48 42.62 14.62 48 24 48z"
                            />
                        </svg>

                        <span className="text-gray-700 font-medium">
    Continue with Google
  </span>
                    </button>


                    {/* Sign Up Link */}
                    <div className="text-center text-sm text-gray-600 pt-2">
                        Don't have an account?{" "}
                        <Link
                            href="../auth/selectRole"
                            className="text-blue-600 hover:text-blue-700"
                        >
                            Create one
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
