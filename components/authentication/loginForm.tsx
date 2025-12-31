"use client";

import { useLoginForm } from "@/hooks/authentication/useLoginForm";
import ReCAPTCHA from "react-google-recaptcha";
import Link from "next/link";

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
    <div className="w-full max-w-sm lg:max-w-sm bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-5 lg:p-6 border border-white/30 hidden sm:block">
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {errorMessage && (
          <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-200 text-center">
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

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
            className="w-full px-3 py-2 border-2 rounded-lg text-sm bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="juan@email.com"
            disabled={isLoggingIn}
          />
        </div>

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
              className="w-full px-3 py-2 pr-10 border-2 rounded-lg text-sm
                 bg-white/80 border-gray-200
                 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
              disabled={isLoggingIn}
            />

            {/* 👁️ Show / Hide Password */}
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoggingIn}
              className="absolute right-3 top-1/2 -translate-y-1/2
                 text-gray-500 hover:text-gray-700
                 focus:outline-none"
            >
              {showPassword ? (
                /* Eye Off */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.61.38-3.132 1.056-4.48M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ) : (
                /* Eye */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
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
          <Link
            href="./forgot-password"
            className="text-blue-600 hover:text-blue-800 text-xs"
          >
            Forgot password?
          </Link>
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
          {/* Google Logo SVG */}
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
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
          <span className="text-gray-700 font-medium text-sm">
            Continue with Google
          </span>
        </button>

        <div className="text-center text-xs text-gray-600 pt-1">
          Don't have an account?{" "}
          <Link
            href="../auth/selectRole"
            className="text-blue-600 hover:text-blue-800"
          >
            Create one
          </Link>
        </div>
      </form>
    </div>
  );
}
