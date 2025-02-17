
'use client'
import GoogleLogo from "../../../../components/google-logo";
import Link from "next/link";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { requestFCMPermission } from "../../../../pages/lib/firebaseConfig";
import Swal from "sweetalert2";
import useAuthStore from "../../../../pages/zustand/authStore"; // Your auth store

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const router = useRouter();
  const [message, setMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const { user, admin, logout } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          router.replace(`/pages/${data.userType}/dashboard`);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    // ✅ Remove 2FA session and replace history state
    sessionStorage.removeItem("pending2FA");

    // ✅ Remove previous navigation history (disables forward button)
    window.history.pushState(null, "", "/pages/auth/login");
    window.history.replaceState(null, "", "/pages/auth/login");

    if (user || admin) {
      router.replace(user ? "/pages/tenant/dashboard" : "/pages/admin/dashboard");
    }
  }, [user, admin]);


  const redirectBasedOnUserType = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        router.replace(`/pages/${data.userType}/dashboard`);
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

  const handleGoogleSignin = async () => {
    await router.push(`/api/auth/google-login`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let fcm_token = null;

    try {
      fcm_token = await requestFCMPermission();
    } catch (error) {
      console.error("FCM Token Error:", error);
    }

    try {
      loginSchema.parse(formData);
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, fcm_token }),
        credentials: "include",
      });
      const data = await response.json();
        if (data.requires_otp) {
          Swal.fire("2FA Required", "OTP sent to your email.", "info");
          return router.push(`/pages/auth/verify-2fa?user_id=${data.user_id}`);
        } else {
          Swal.fire("Success", "Login successful!", "success");
        }

      setMessage("Login successful!");
      return await redirectBasedOnUserType();
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Invalid credentials");
    }
  };

  return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Rentahan Logo</h1>

          {errorMessage && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                {errorMessage}
              </div>
          )}
          {message && (
              <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
                {message}
              </div>
          )}

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
              >
                Forgot Password?
              </Link>
            </p>
            <button
                type="submit"
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
                href="../auth/register"
                className="text-blue-600 hover:underline font-medium"
            >
              Create Now
            </Link>
          </p>
        </div>
      </div>
  );
}
