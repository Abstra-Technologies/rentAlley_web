
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
  }, [user, router, user?.userType]);


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
      <div className="min-h-screen flex flex-col">
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
                    <span className="block select-none typographica text-transparent text-9xl leading-[1.4] bg-clip-text bg-gradient-to-r from-emerald-400 to-lime-300 drop-shadow-[2px_2px_2px_rgba(0,0,0,0.4)]">
                      UpKyp
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
            <div className="relative z-20 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <div className="max-w-md mx-auto">
                {/* Logo and Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-6 lg:bg-transparent lg:shadow-none">
                    <Image
                      src="/Hestia-logo-b.svg"
                      alt="Hestia Logo"
                      width={60}
                      height={45}
                      className="object-contain"
                    />
                  </div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent mb-2">
                        Welcome Back
                    </h2>

                    <p className="text-blue-200 lg:text-gray-600">
                    Sign in to access your account
                  </p>
                </div>

                {/* Form Card */}
                <div className="bg-white/95 lg:bg-white backdrop-blur-sm rounded-2xl shadow-xl lg:shadow-lg p-6 sm:p-8 border border-white/20 lg:border-gray-200">
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    noValidate
                  >
                    {/* Error Message */}
                    {errorMessage && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                        <svg
                          className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-sm text-red-800">{errorMessage}</p>
                      </div>
                    )}

                    {/* Email Field */}
                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="email"
                          autoComplete="email"
                          className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 bg-white
                            ${
                              focusedField === "email"
                                ? "border-blue-500 ring-4 ring-blue-500/10"
                                : "border-gray-200"
                            }
                            ${
                              errors.email
                                ? "border-red-300 bg-red-50"
                                : "hover:border-gray-300"
                            }
                            focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                            placeholder:text-gray-400`}
                          value={formData.email}
                          onChange={handleChange}
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => setFocusedField("")}
                          placeholder="juan@email.com"
                          aria-describedby={
                            errors.email ? "email-error" : undefined
                          }
                          disabled={isLoggingIn}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                            />
                          </svg>
                        </div>
                      </div>
                      {errors.email && (
                        <p
                          id="email-error"
                          className="text-sm text-red-600 flex items-center"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          autoComplete="current-password"
                          className={`w-full px-4 py-3 pr-12 border-2 rounded-xl transition-all duration-200 bg-white
                            ${
                              focusedField === "password"
                                ? "border-blue-500 ring-4 ring-blue-500/10"
                                : "border-gray-200"
                            }
                            ${
                              errors.password
                                ? "border-red-300 bg-red-50"
                                : "hover:border-gray-300"
                            }
                            focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                            placeholder:text-gray-400`}
                          value={formData.password}
                          onChange={handleChange}
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField("")}
                          placeholder="••••••••"
                          aria-describedby={
                            errors.password ? "password-error" : undefined
                          }
                          disabled={isLoggingIn}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p
                          id="password-error"
                          className="text-sm text-red-600 flex items-center"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          id="rememberMe"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          disabled={isLoggingIn}
                        />
                        <span className="ml-2 text-gray-600">Remember me</span>
                      </label>
                      <Link
                        href="./forgot-password"
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    {/* reCAPTCHA */}
                    <div className="flex justify-center">
                      <ReCAPTCHA
                        sitekey={
                          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
                          "your-site-key"
                        }
                        onChange={(token) => setCaptchaToken(token)}
                        theme="light"
                      />
                    </div>

                    {/* Login Button */}
                      <button
                          type="submit"
                          disabled={isLoggingIn || !captchaToken}
                          className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-blue-400 disabled:to-emerald-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:shadow-md transform hover:scale-[1.02] disabled:transform-none"
                      >

                      {isLoggingIn ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </button>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative bg-white px-4">
                        <span className="text-sm text-gray-500 font-medium">
                          or continue with
                        </span>
                      </div>
                    </div>

                    {/* Google Sign In */}
                    <button
                      type="button"
                      onClick={handleGoogleSignin}
                      disabled={isLoggingIn}
                      className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      <GoogleLogo className="mr-3" />
                      Continue with Google
                    </button>

                    {/* Sign Up Link */}
                    <p className="text-center text-sm text-gray-600 pt-4">
                      Don't have an account?{" "}
                      <Link
                        href="../auth/selectRole"
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                      >
                        Create account
                      </Link>
                    </p>

                    {/* Admin Login Link */}
                    <p className="text-center text-sm pt-2">
                      <Link
                        href="/pages/admin_login"
                        className="text-teal-600 hover:text-teal-800 font-medium hover:underline transition-colors"
                      >
                        System Admin Login
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
