"use client";

import { useLoginForm } from "@/hooks/authentication/useLoginForm";
import ReCAPTCHA from "react-google-recaptcha";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
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
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
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
