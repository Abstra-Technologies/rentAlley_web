"use client";
import GoogleLogo from "../../../../components/google-logo";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import useAuthStore from "../../../../zustand/authStore";
import { logEvent } from "../../../../utils/gtag";
import Footer from "../../../../components/navigation/footer";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
});



export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Login />
    </Suspense>
  );
}







function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const router = useRouter();
  const { user, admin, fetchSession } = useAuthStore();
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    sessionStorage.removeItem("pending2FA");
    window.history.replaceState(null, "", "/pages/auth/login");

    if (user || admin) {
      router.replace(user ? "/" : "/pages/admin/dashboard");
    }
  }, [user, admin]);

  const redirectBasedOnUserType = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        console.log("Redirecting user type:", data.userType);

        switch (data.userType) {
          case "tenant":
            return router.replace("/pages/find-rent");
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

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    try {
      loginSchema.pick({ [id]: true }).parse({ [id]: value });
      setErrors((prevErrors) => ({ ...prevErrors, [id]: "" }));
    } catch (error) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: error.errors[0]?.message || "",
      }));
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
      await router.push("/api/auth/google-login");

      const response = await fetch("/api/auth/googlecallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || "Google sign-in failed.");
    } catch (err) {
      console.error("Google Sign-In Error:", err.message);
      setErrorMessage("Google sign-in failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    logEvent(
      "Login Attempt",
      "User Interaction",
      "User Submitted Login Form",
      1
    );

    try {
      loginSchema.parse(formData);
      setIsLoggingIn(true);

      Swal.fire({
        title: "Logging in...",
        text: "Please wait while we verify your credentials.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (response.ok) {
        logEvent(
          "Login Success",
          "Authentication",
          "User Successfully Logged In",
          1
        );

        if (data.requires_otp) {
          Swal.fire("2FA Required", "OTP sent to your email.", "info");
          setIsLoggingIn(false);
          return router.push(`/pages/auth/verify-2fa?user_id=${data.user_id}`);
        } else {
          Swal.fire("Success", "Login successful!", "success");
          await fetchSession();
          setIsLoggingIn(false);
          return await redirectBasedOnUserType();
        }
      } else {
        logEvent(
          "Login Failed",
          "Authentication",
          "User Entered Incorrect Credentials",
          1
        );
        setErrorMessage(data.error || "Invalid credentials");
        Swal.fire("Error", data.error || "Invalid credentials", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      Swal.fire("Error", "Something went wrong. Please try again.", "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <div className="relative flex justify-center items-center min-h-screen bg-gray-100 overflow-hidden">
        <Image
          src="/images/hero-section.jpeg"
          alt="Cityscape view of high-rise buildings"
          fill
          className="absolute inset-0 object-cover brightness-75"
          priority
        />

        <div className="relative z-10 bg-white p-10 rounded-2xl shadow-lg w-full max-w-lg">
          <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
            Rentahan
          </h1>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={handleChange}
                placeholder="juan@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <p className="text-center text-sm">
              <Link
                href="./forgot-password"
                className="text-blue-600 hover:text-blue-800 hover:underline"
                onClick={() =>
                  logEvent(
                    "Forgot Password Click",
                    "User Interaction",
                    "Clicked Forgot Password",
                    1
                  )
                }
              >
                Forgot Password?
              </Link>
            </p>

            <button
              type="submit"
              onClick={() =>
                logEvent("Button Click", "User Interaction", "User Login", 1)
              }
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
            >
              Login
            </button>

            <p className="text-center text-sm mt-3">
              <Link
                href="/pages/admin_login"
                className="text-teal-600 hover:text-teal-800 hover:underline font-medium"
                onClick={() =>
                  logEvent(
                    "Admin Login Click",
                    "User Interaction",
                    "Clicked Admin Login",
                    1
                  )
                }
              >
                System Admin Login
              </Link>
            </p>
          </form>

          <div className="flex items-center my-6">
            <div className="border-t border-gray-300 flex-grow"></div>
            <span className="mx-3 text-gray-500 font-medium">or</span>
            <div className="border-t border-gray-300 flex-grow"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignin}
            className="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center bg-white shadow-md hover:bg-gray-50 transition-all"
          >
            <GoogleLogo className="mr-2" />
            <span className="font-medium text-gray-700">Login with Google</span>
          </button>
          {error && (
            <p className="text-red-600 text-sm">{decodeURIComponent(error)}</p>
          )}
          <p className="mt-6 text-center text-sm text-gray-500">
            Don&#39;t have an account?
            <Link
              href="../auth/selectRole"
              className="text-blue-600 hover:underline font-medium ml-1"
            >
              Create Now
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
