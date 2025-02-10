"use client";

import GoogleLogo from "../../../../components/google-logo";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const router = useRouter();
  const [message, setMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const redirectBasedOnUserType = (userType) => {
    // Redirect based on userType
    if (userType === "tenant") {
      router.push("/pages/tenant/dashboard");
    } else if (userType === "landlord") {
      router.push("/pages/landlord/dashboard");
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });

    // Validate the field as the user types
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

    try {
      // Validate the entire form
      loginSchema.parse(formData);
      console.log("Login Data:", formData);
      // validation logic for admin_login backend api if the credentials are correct
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMessage("Login failed");
        new Error(data.error || "Login failed");
      } else {
        setMessage("Login successful!");
      }
      const token = data.token; // JWT token
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      const userType = decodedToken.userType; // this is for the user to be redirected to proper page

      redirectBasedOnUserType(userType);
    } catch (error) {
      setErrors(error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Rentahan Logo</h1>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {errorMessage}
          </div>
        )}
        {/* Success Message */}
        {message && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {message}
          </div>
        )}

        {/* Login Form */}
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

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="border-t border-gray-300 flex-grow"></div>
          <span className="mx-3 text-gray-500 font-medium">or</span>
          <div className="border-t border-gray-300 flex-grow"></div>
        </div>

        {/* Login with Google */}
        <button
          type="button"
          onClick={handleGoogleSignin}
          className="w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition"
        >
          <GoogleLogo />
          <span className="font-medium text-gray-700">Login with Google</span>
        </button>

        {/* Register Link */}
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
