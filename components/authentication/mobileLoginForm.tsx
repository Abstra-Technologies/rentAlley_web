"use client";

import { useLoginForm } from "@/hooks/authentication/useLoginForm";
import ReCAPTCHA from "react-google-recaptcha";
import GoogleLogo from "@/components/google-logo";
import Link from "next/link";

export default function MobileLoginForm() {
    const {
        formData, showPassword, setShowPassword, errorMessage, isLoggingIn,
        captchaToken, setCaptchaToken, rememberMe, setRememberMe,
        handleChange, handleGoogleSignin, handleSubmit
    } = useLoginForm();

    return (
        <div className="w-full max-w-xs mx-auto bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-3 border border-white/30 mt-10 sm:hidden">
            {/* Mobile Header */}
            <div className="text-center mb-3">
                <h2 className="text-base font-bold text-gray-800">Sign In</h2>
                <p className="text-gray-600 text-xs mt-0.5">Access your account</p>
            </div>

            {errorMessage && (
                <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-200 text-center">
                    <p className="text-xs font-medium text-red-700">{errorMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
                {/* Email */}
                <div>
                    <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-0.5">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="juan@email.com"
                        disabled={isLoggingIn}
                        className="w-full px-2.5 py-1.5 border-2 rounded-lg text-xs bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-0.5">Password</label>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        disabled={isLoggingIn}
                        className="w-full px-2.5 py-1.5 border-2 rounded-lg text-xs bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between text-[10px]">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-1 text-gray-600">Remember me</span>
                    </label>
                    <Link href="./forgot-password" className="text-blue-600 hover:text-blue-800 text-[10px]">Forgot?</Link>
                </div>

                {/* reCAPTCHA */}
                <div className="flex justify-center scale-[0.8]">
                    <ReCAPTCHA
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                        onChange={(token) => setCaptchaToken(token)}
                        theme="light"
                    />
                </div>

                {/* Sign In */}
                <button
                    type="submit"
                    disabled={isLoggingIn || !captchaToken}
                    className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold py-1.5 rounded-lg text-xs shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                >
                    {isLoggingIn ? "Signing in..." : "Sign In"}
                </button>

                {/* Google Sign In */}
                <button
                    type="button"
                    onClick={handleGoogleSignin}
                    disabled={isLoggingIn}
                    className="w-full bg-white flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-1.5 text-xs shadow-sm hover:shadow-md transition-all"
                >
                    <GoogleLogo />
                    <span className="text-gray-700 font-medium text-xs">Continue with Google</span>
                </button>

                {/* Sign up */}
                <div className="text-center text-[10px] text-gray-600 pt-1">
                    Don’t have an account?{" "}
                    <Link href="../auth/selectRole" className="text-blue-600 hover:text-blue-800">Create one</Link>
                </div>
            </form>
        </div>
    );
}
