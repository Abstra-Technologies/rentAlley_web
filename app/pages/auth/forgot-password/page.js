"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

const forgotPasswordSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        /^[a-zA-Z0-9]+$/,
        "Password must contain only letters and numbers"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ForgotPassword() {
  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      // Validate form data
      forgotPasswordSchema.parse(formData);
      setErrors({});
      console.log("Form submitted:", formData);
      // Handle successful submission logic here
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = err.errors.reduce((acc, error) => {
          acc[error.path[0]] = error.message;
          return acc;
        }, {});
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-2xl p-8 max-w-sm w-full">
        <h1 className="text-2xl text-center text-gray-800 mb-3">
          Rentahan Logo
        </h1>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Forgot Password
        </h2>
        <p className="text-sm text-gray-600 text-center mb-8">
          Enter your email and a new password to reset your account.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email Address */}
          <div className="mb-6">
            <label htmlFor="email" className="text-gray-800 text-sm mb-2 block">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full px-4 py-3 rounded-md border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* New Password */}
          <div className="mb-6">
            <label
              htmlFor="newPassword"
              className="text-gray-800 text-sm mb-2 block"
            >
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="w-full px-4 py-3 rounded-md border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your new password"
              value={formData.newPassword}
              onChange={handleChange}
            />
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="text-gray-800 text-sm mb-2 block"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="w-full px-4 py-3 rounded-md border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm your new password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 transition"
          >
            Reset Password
          </button>
        </form>

        {/* Go Back to Login */}
        <p className="text-sm text-gray-600 text-center mt-6">
          Remember your password?{" "}
          <Link
            href="../auth/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
