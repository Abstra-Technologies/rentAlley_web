"use client";
import GoogleLogo from "../../../../components/google-logo";
import Link from "next/link";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import useAuthStore from "../../../../zustand/authStore";
import { logEvent } from "../../../../utils/gtag";
import Footer from "../../../../components/navigation/footer";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const router = useRouter();
  const [message] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const { user, admin, fetchSession } = useAuthStore();

  useEffect(() => {
    sessionStorage.removeItem("pending2FA");
    window.history.pushState(null, "", "/pages/auth/login");
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

        console.log("✅ Redirecting user type:", data.userType);

        switch (data.userType) {
          case "tenant":
            return router.replace("/");
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
    setFormData({ ...formData, [id]: value });

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

  // const handleGoogleSignin = async () => {
  //   logEvent("Login Attempt", "Google Sign-In", "User Clicked Google Login", 1);
  //   try {
  //     const response = await fetch(`/api/auth/google-login`);
  //     if (!response.ok) {
  //       router.push("/pages/auth/google-login-error");
  //       return;
  //     }

  //     const data = await response.json();
  //     if (data.url) {
  //       window.location.href = data.url;
  //     } else {
  //       router.push("/pages/auth/google-login-error");
  //     }
  //   } catch (error) {
  //     console.error("Google login error:", error);
  //     router.push("/pages/auth/google-login-error");
  //   }
  // };

  const handleGoogleSignin = async () => {
    logEvent("Login Attempt", "Google Sign-In", "User Clicked Google Login", 1);
    await router.push(`/api/auth/google-login`);
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
      const response = await fetch("/api/auth/signin", {
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
          return router.push(`/pages/auth/verify-2fa?user_id=${data.user_id}`);
        } else {
          Swal.fire("Success", "Login successful!", "success");

          await fetchSession();
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
      setErrorMessage("Invalid credentials");

      Swal.fire("Error", "Something went wrong. Please try again.", "error");
    }
  };

  return (
    <>
      <div className="relative flex justify-center items-center h-screen bg-gray-100 overflow-hidden">
        <Image
          src="/images/hero-section.jpeg"
          alt="Cityscape view of high-rise buildings"
          fill
          className="object-cover brightness-75 z-0"
          priority
        />
        <div className="relative z-10 bg-white p-6 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
            Rentahan
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
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
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={handleChange}
                placeholder="juantamad@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
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
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>
            <p className="text-center">
              <Link
                href="./forgot-password"
                className="text-blue-600 hover:text-blue-900 hover:cursor-pointer hover:underline"
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
              className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="border-t border-gray-300 flex-grow"></div>
            <span className="mx-3 text-gray-500 font-medium">or</span>
            <div className="border-t border-gray-300 flex-grow"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignin}
            className="w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition"
          >
            <GoogleLogo />
            <span className="font-medium text-gray-700">Login with Google</span>
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&#39;t have an account?{" "}
            <Link
              href="../auth/selectRole"
              className="text-blue-600 hover:underline font-medium"
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
