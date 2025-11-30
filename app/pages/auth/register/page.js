"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { z } from "zod";
import useRoleStore from "../../../../zustand/store";
import { useRouter, useSearchParams } from "next/navigation";
import { logEvent } from "../../../../utils/gtag";
import Page_footer from "../../../../components/navigation/page_footer";
import Image from "next/image";
import Swal from "sweetalert2";
import LoadingScreen from "@/components/loadingScreen";

const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .refine(
        (value) => /^[\w!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/.test(value),
        "Password contains invalid characters"
      ),
    confirmPassword: z.string().min(8, "Confirm Password must be the same."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading registration..." />}>
      <Register />
    </Suspense>
  );
}

function Register() {
  const role = useRoleStore((state) => state.role);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const error_2 = searchParams.get("error");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: role,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const handleCheckboxChange = (e) => {
    setAgreeToTerms(e.target.checked);
  };

  const handleGoogleSignup = () => {
    logEvent(
      "Login Attempt",
      "Google Sign-Up",
      "User Clicked Google Sign-Up",
      1
    );
    router.push(`/api/auth/googleSignUp?userType=${role}`);
  };

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      role: role,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }));
  }, [role]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));

    // Clear errors on input
    if (errors[id]) {
      setErrors((prevErrors) => ({ ...prevErrors, [id]: "" }));
    }
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError("");

    try {
      registerSchema.parse(formData);

      if (!agreeToTerms) {
        Swal.fire({
          icon: "error",
          title: "Terms Not Accepted",
          text: "You must agree to the Terms of Service and Privacy Policy before registering.",
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
        Swal.fire({
          title: "Success!",
          text: "Account successfully registered! Redirecting...",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => router.push("/pages/auth/verify-email"));
      } else if (data.error && data.error.includes("already")) {
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
        }, {});
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

  return (
    <>
      <div className="relative flex flex-col min-h-screen bg-gradient-to-br from-blue-900 via-emerald-700 to-emerald-500 overflow-hidden">
        {/* Background */}
        <Image
          src="/images/hero-section.jpeg"
          alt="UpKyp background"
          fill
          priority
          className="object-cover brightness-75"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-emerald-800/70 to-emerald-600/70" />

        {/* Main Section */}
        <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center flex-1 px-4 sm:px-8 py-16 lg:py-24 gap-8 lg:gap-20">
          {/* Hero Text - Large screens only */}
          <div className="hidden lg:block text-white max-w-lg text-center lg:text-left space-y-4 lg:space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-lg">
              Property Management Made Simple
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400 mt-2">
                Get Started Today
              </span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-blue-50/90">
              Create your account and experience seamless property management with automated billing and smart tenant tools.
            </p>
          </div>

          {/* Registration Form */}
          <div className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-10 lg:p-12 border border-white/30 mt-10 lg:mt-0">
            {/* Mobile Header */}
            <div className="block lg:hidden text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Create Account
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Register as{" "}
                <span className="font-semibold text-blue-600">{role}</span>
              </p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Register as <span className="text-blue-600">{role}</span>
              </h2>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-center animate-fade-in">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {error_2 && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-center animate-fade-in">
                <p className="text-sm font-medium text-red-700">
                  {decodeURIComponent(error_2)}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("firstName")}
                  onBlur={() => setFocusedField("")}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all ${
                    focusedField === "firstName"
                      ? "border-blue-500 ring-2 ring-blue-500/10"
                      : "border-gray-200 hover:border-gray-300"
                  } bg-white/80 placeholder:text-gray-400 focus:outline-none`}
                  placeholder="Juan"
                  disabled={isRegistering}
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("lastName")}
                  onBlur={() => setFocusedField("")}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all ${
                    focusedField === "lastName"
                      ? "border-blue-500 ring-2 ring-blue-500/10"
                      : "border-gray-200 hover:border-gray-300"
                  } bg-white/80 placeholder:text-gray-400 focus:outline-none`}
                  placeholder="Dela Cruz"
                  disabled={isRegistering}
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all ${
                    focusedField === "email"
                      ? "border-blue-500 ring-2 ring-blue-500/10"
                      : "border-gray-200 hover:border-gray-300"
                  } ${
                    errors.email ? "border-red-300 bg-red-50" : "bg-white/80"
                  } placeholder:text-gray-400 focus:outline-none`}
                  placeholder="juan@email.com"
                  disabled={isRegistering}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
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
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                    className={`w-full px-4 py-3 pr-10 border-2 rounded-xl text-sm transition-all ${
                      focusedField === "password"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-gray-200 hover:border-gray-300"
                    } ${
                      errors.password
                        ? "border-red-300 bg-red-50"
                        : "bg-white/80"
                    } placeholder:text-gray-400 focus:outline-none`}
                    placeholder="••••••••"
                    disabled={isRegistering}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d={
                          showPassword
                            ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                            : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        }
                      />
                    </svg>
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField("")}
                    className={`w-full px-4 py-3 pr-10 border-2 rounded-xl text-sm transition-all ${
                      focusedField === "confirmPassword"
                        ? "border-blue-500 ring-2 ring-blue-500/10"
                        : "border-gray-200 hover:border-gray-300"
                    } ${
                      errors.confirmPassword
                        ? "border-red-300 bg-red-50"
                        : "bg-white/80"
                    } placeholder:text-gray-400 focus:outline-none`}
                    placeholder="••••••••"
                    disabled={isRegistering}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d={
                          showConfirmPassword
                            ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                            : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        }
                      />
                    </svg>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start text-xs text-gray-700 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isRegistering}
                />
                <label htmlFor="terms" className="ml-2 leading-relaxed">
                  I agree to the{" "}
                  <Link
                    href="/pages/terms-services"
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/pages/terms-services"
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isRegistering || !agreeToTerms}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRegistering ? "Creating Account..." : "Create Account"}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative bg-white/90 px-3">
                  <span className="text-xs text-gray-500 font-medium">
                    or continue with
                  </span>
                </div>
              </div>

              {/* Google Sign Up */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isRegistering}
                className="w-full bg-white flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-5 h-5"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.1 0 5.9 1.1 8.1 3.3l6-6C34.9 3.2 29.8 1 24 1 14.8 1 7 6.9 3.5 15l7 5.4C12 13.8 17.5 9.5 24 9.5z"
                    />
                    <path
                      fill="#34A853"
                      d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.4 5.6-5 7.3l7.7 6c4.5-4.1 7.1-10.2 7.1-17.8z"
                    />
                    <path
                      fill="#4A90E2"
                      d="M24 47c6.4 0 11.8-2.1 15.7-5.7l-7.7-6c-2.1 1.4-4.8 2.2-8 2.2-6.5 0-12-4.3-13.9-10.1l-7 5.4C7 41.1 14.8 47 24 47z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.1 27.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7-5.4C2.4 16.5 1.5 20.1 1.5 23s.9 6.5 2.6 9.8l7-5.4z"
                    />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 text-sm">
                  Sign up with{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                    Google
                  </span>
                </span>
              </button>

              {/* Footer Links */}
              <div className="text-center text-xs text-gray-600 pt-2">
                <p>
                  Already have an account?{" "}
                  <Link
                    href="/pages/auth/login"
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </main>

        <Page_footer />
      </div>
    </>
  );
}
