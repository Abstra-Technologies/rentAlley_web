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
  const { user, admin, fetchSession } = useAuthStore();
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState("");

  const redirectBasedOnUserType = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        switch (data.userType) {
          case "tenant":
            return router.replace("/pages/tenant/my-unit");
          case "landlord":
            return router.replace("/pages/landlord/dashboard");
          case "admin":
            return router.replace("/pages/admin/dashboard");
          default:
            return router.replace("/pages/auth/login");
        }
      }
    } catch (error) {
      console.error("Redirection failed:", error);
    }
  };

  useEffect(() => {
    sessionStorage.removeItem("pending2FA");
    window.history.replaceState(null, "", "/pages/auth/login");
    if (user || admin) {
      redirectBasedOnUserType();
    }
  }, [user, admin]);

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

    // Validate form
    try {
      loginSchema.parse(formData);
    } catch (error: any) {
      const fieldErrors = {};
      error.errors.forEach((err) => {
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
          await redirectBasedOnUserType();
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
        <div className="h-screen flex">
        {/* Main Content */}
        <main className="flex-1 flex">
          {/* Hero Section - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-700/90 to-emerald-600/90 z-10"></div>
            <Image
              src="/images/hero-section.jpeg"
              alt="Modern cityscape with high-rise buildings"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 0vw, 50vw"
            />
            <div className="relative z-20 flex flex-col justify-center items-start p-12 xl:p-16 text-white">
              <div className="max-w-md">
                <h1 className="text-xl xl:text-5xl font-bold mb-6 leading-tight">
                  Welcome to
                    <span className="block select-none typographica text-transparent text-8xl leading-[1.4] bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-300 drop-shadow-[2px_2px_2px_rgba(0,0,0,0.4)]">
                      Upkyp
                    </span>

                </h1>
                <p className="text-lg xl:text-xl text-blue-100 mb-8 leading-relaxed">
                  Your trusted partner in property management. Streamline your
                  rental experience with our comprehensive platform.
                </p>
                <div className="flex items-center space-x-4 text-blue-200">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Secure & Reliable
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Easy to Use
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center relative">
            {/* Mobile Background */}
            <div className="absolute inset-0 lg:hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 to-purple-900/80 z-10"></div>
              <Image
                src="/images/hero-section.jpeg"
                alt="Modern cityscape background"
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>

            {/* Form Container */}
            <div className="relative z-20 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="w-full max-w-sm mx-auto">
                {/* Logo and Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-xl shadow mb-4">
                    <Image
                        src="/Hestia-logo-b.svg"
                        alt="Hestia Logo"
                        width={48}
                        height={36}
                        className="object-contain"
                    />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent mb-1">
                    Welcome Back
                  </h2>
                  <p className="text-blue-200 lg:text-gray-600 text-xs">
                    Sign in to access your account
                  </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow p-4 sm:p-5 border border-gray-200">
                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    {/* Email Field */}
                    <div className="space-y-1">
                      <label
                          htmlFor="email"
                          className="block text-xs font-medium text-gray-700"
                      >
                        Email Address
                      </label>
                      <input
                          type="email"
                          id="email"
                          autoComplete="email"
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="juan@email.com"
                      />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1">
                      <label
                          htmlFor="password"
                          className="block text-xs font-medium text-gray-700"
                      >
                        Password
                      </label>
                      <input
                          type="password"
                          id="password"
                          autoComplete="current-password"
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          placeholder="••••••••"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center">
                        <input type="checkbox" className="w-3 h-3 mr-1" />
                        Remember me
                      </label>
                      <Link href="./forgot-password" className="text-blue-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-semibold py-2 rounded-lg shadow hover:shadow-md transition"
                    >
                      Sign In
                    </button>

                    {/* Divider */}
                    <div className="relative flex items-center my-3">
                      <div className="w-full border-t border-gray-200"></div>
                      <span className="px-2 bg-white text-xs text-gray-400">or</span>
                    </div>

                    {/* Google Sign In */}
                    <button
                        type="button"
                        className="w-full border text-sm py-2 rounded-lg flex items-center justify-center hover:bg-gray-50 transition"
                    >
                      <GoogleLogo className="mr-2 w-4 h-4" />
                      Continue with Google
                    </button>

                    {/* Links */}
                    <p className="text-center text-xs text-gray-600 pt-2">
                      Don’t have an account?{" "}
                      <Link href="../auth/selectRole" className="text-blue-600 hover:underline">
                        Create account
                      </Link>
                    </p>
                  </form>
                </div>
              </div>
            </div>


          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
