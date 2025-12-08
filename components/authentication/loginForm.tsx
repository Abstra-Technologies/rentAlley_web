"use client";

import { useLoginForm } from "@/hooks/authentication/useLoginForm";
import ReCAPTCHA from "react-google-recaptcha";
import GoogleLogo from "@/components/google-logo";
import Link from "next/link";

export default function LoginForm() {
    const {
        formData, showPassword, setShowPassword, errorMessage, isLoggingIn,
        captchaToken, setCaptchaToken, rememberMe, setRememberMe,
        handleChange, handleGoogleSignin, handleSubmit
    } = useLoginForm();

    return (
        <div className="w-full max-w-sm lg:max-w-sm bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-5 lg:p-6 border border-white/30 hidden sm:block">
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                {errorMessage && (
                    <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-200 text-center">
                        <p className="text-sm font-medium text-red-700">{errorMessage}</p>
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border-2 rounded-lg text-sm bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="juan@email.com"
                        disabled={isLoggingIn}
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border-2 rounded-lg text-sm bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="••••••••"
                            disabled={isLoggingIn}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-600">Remember me</span>
                    </label>
                    <Link href="./forgot-password" className="text-blue-600 hover:text-blue-800 text-xs">Forgot password?</Link>
                </div>

                <div className="flex justify-center">
                    <ReCAPTCHA
                        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                        onChange={(token) => setCaptchaToken(token)}
                        theme="light"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoggingIn || !captchaToken}
                    className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold py-2 rounded-lg text-sm shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                >
                    {isLoggingIn ? "Signing in..." : "Sign In"}
                </button>

                <button
                    type="button"
                    onClick={handleGoogleSignin}
                    disabled={isLoggingIn}
                    className="w-full bg-white flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2 text-sm shadow-sm hover:shadow-md transition-all"
                >
                    <GoogleLogo />
                    <span className="text-gray-700 font-medium text-sm">Continue with Google</span>
                </button>

                <div className="text-center text-xs text-gray-600 pt-1">
                    Don’t have an account?{" "}
                    <Link href="../auth/selectRole" className="text-blue-600 hover:text-blue-800">Create one</Link>
                </div>
            </form>
        </div>
    );
}
