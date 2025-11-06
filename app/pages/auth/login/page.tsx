
"use client";
import GoogleLogo from "../../../../components/google-logo";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "../../../../zustand/authStore";
import { logEvent } from "../../../../utils/gtag";
import Footer from "../../../../components/navigation/footer";
import Image from "next/image";
import ReCAPTCHA from "react-google-recaptcha";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

import LoadingScreen from "@/components/loadingScreen";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading authentication..." />}>
      <Login />
    </Suspense>
  );
}

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { user, fetchSession } = useAuthStore();
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  useEffect(() => {
    if (user) {
      if (user.userType === "tenant") {
        router.replace("/pages/tenant/feeds");
      } else if (user.userType === "landlord") {
        router.replace("/pages/landlord/dashboard");
      } else {
        router.replace("/");
      }
    } else if (!user) {
      fetchSession();
    }
  }, [user, router]);


  useEffect(() => {
    sessionStorage.removeItem("pending2FA");
    window.history.replaceState(null, "", "/pages/auth/login");
  }, [user]);

  useEffect(() => {
    if (error) {
      setErrorMessage("Authentication failed. Please try again.");
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    // Clear errors on input
    if (errors[id]) {
      setErrors((prevErrors) => ({ ...prevErrors, [id]: "" }));
    }
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleGoogleSignin = async () => {
    setIsLoggingIn(true);
    setErrorMessage("");
    try {
      logEvent(
        "Login Attempt",
        "Google Sign-In",
        "User Clicked Google Login",
        1
      );
      router.push("/api/auth/google-login");
    } catch (err: any) {
      console.error("Google Sign-In Error:", err.message);
      setErrorMessage("Google sign-in failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate form
    try {
      loginSchema.parse(formData);
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err: any) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!captchaToken) {
      setErrorMessage("Please verify you're not a robot.");
      return;
    }

    logEvent(
        "Login Attempt",
        "User Interaction",
        "User Submitted Login Form",
        1
    );

    try {
      setIsLoggingIn(true);
      setErrorMessage("");

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, captchaToken, rememberMe }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        logEvent(
            "Login Success",
            "Authentication",
            "User Successfully Logged In",
            1
        );

        if (data.requires_otp) {
          router.push(`/pages/auth/verify-2fa?user_id=${data.user_id}`);
        } else {
          await fetchSession();
          if (data.redirectUrl) {
            router.replace(data.redirectUrl);
          }
        }
      } else {
        logEvent(
            "Login Failed",
            "Authentication",
            "User Entered Incorrect Credentials",
            1
        );
        setErrorMessage(data.error || "Invalid credentials");

        if (window.grecaptcha) window.grecaptcha.reset();
        setCaptchaToken(null);
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      if (window.grecaptcha) window.grecaptcha.reset();
      setCaptchaToken(null);
    } finally {
      setIsLoggingIn(false);
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
            {/* ✅ Hero Text — visible only on large screens */}
            <div className="hidden lg:block text-white max-w-lg text-center lg:text-left space-y-4 lg:space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-lg">
                Manage. Automate. Simplify.
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400 typographica mt-2">
              UpKyp
            </span>
              </h1>
              <p className="mt-4 text-base sm:text-lg text-blue-50/90">
                The smarter way to handle rentals — automate your billing, leases,
                and tenant communication in one place.
              </p>
            </div>

            {/* ✅ Login Form — always visible */}
            <div className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-10 lg:p-12 border border-white/30 mt-10 lg:mt-0">
              {/* ✅ Mobile Header */}
              <div className="block lg:hidden text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Sign in to your account
                </p>
              </div>

              {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-center animate-fade-in">
                    <p className="text-sm font-medium text-red-700">{errorMessage}</p>
                  </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                      className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all ${
                          focusedField === "email"
                              ? "border-blue-500 ring-2 ring-blue-500/10"
                              : "border-gray-200 hover:border-gray-300"
                      } ${
                          errors.email ? "border-red-300 bg-red-50" : "bg-white/80"
                      } placeholder:text-gray-400 focus:outline-none`}
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField("")}
                      placeholder="juan@email.com"
                      disabled={isLoggingIn}
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
                        autoComplete="current-password"
                        className={`w-full px-4 py-3 pr-10 border-2 rounded-xl text-sm transition-all ${
                            focusedField === "password"
                                ? "border-blue-500 ring-2 ring-blue-500/10"
                                : "border-gray-200 hover:border-gray-300"
                        } ${
                            errors.password ? "border-red-300 bg-red-50" : "bg-white/80"
                        } placeholder:text-gray-400 focus:outline-none`}
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField("")}
                        placeholder="••••••••"
                        disabled={isLoggingIn}
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
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center">
                    <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={isLoggingIn}
                    />
                    <span className="ml-2 text-gray-600">Remember me</span>
                  </label>
                  <Link
                      href="./forgot-password"
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* reCAPTCHA */}
                <div className="flex justify-center scale-[0.9] origin-center">
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
                    className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                >
                  {isLoggingIn ? "Signing in..." : "Sign In"}
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

                {/* Google Sign In */}
                <button
                    type="button"
                    onClick={handleGoogleSignin}
                    disabled={isLoggingIn}
                    className="w-full bg-white flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.99]"
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
                Continue with{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                  Google
                </span>
              </span>
                </button>

                {/* Footer Links */}
                <div className="text-center text-xs text-gray-600 pt-2">
                  <p>
                    Don’t have an account?{" "}
                    <Link
                        href="../auth/selectRole"
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      Create one
                    </Link>
                  </p>
                  <p className="pt-1">
                    <Link
                        href="/pages/admin_login"
                        className="text-teal-600 hover:text-teal-800 font-medium hover:underline"
                    >
                      System Admin Login
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </main>

          <Footer />
        </div>
      </>
  );


}
