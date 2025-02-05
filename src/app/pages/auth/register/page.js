

"use client";

import GoogleLogo from "../../../../components/google-logo";
import Link from "next/link";
import { useState, useEffect } from "react";
import { z } from "zod";
import useRoleStore from "../../../../pages/zustand/store";
import {router, useRouter} from "next/navigation";

// Define the schema for user registration validation
const registerSchema = z
  .object({
    // First Name validation - must not be empty
    firstName: z.string().nonempty("First Name is required"),

    // Last Name validation - must not be empty
    lastName: z.string().nonempty("Last Name is required"),

    // Date of Birth validation - must not be empty
    dob: z.string().nonempty("Date of Birth is required"),

    // Mobile Number validation - must be exactly 12 digits
    mobileNumber: z
      .string()
      .regex(/^\d{12}$/, "Mobile Number must be 12 digits"),

    // Email validation - must be a valid email address
    email: z.string().email("Invalid email address"),

    // Password validation
    password: z
      .string()
      .min(6, "Password must be 6 characters long") // Password must be at least 6 characters
      .refine(
        (value) => /^[a-zA-Z0-9]+$/.test(value), // Password must be alphanumeric (letters and numbers only)
        "Password must contain only letters and numbers"
      ),

    // Confirm Password validation
    confirmPassword: z
      .string()
      .min(6, "Confirm Password must be 6 characters long"),
  })
  // Check that the password and confirm password match
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match", // Error message if passwords don't match
    path: ["confirmPassword"], // This error will be shown under the 'confirmPassword' field
  });

export default function Register() {
  const role = useRoleStore((state) => state.role);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    mobileNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: role,
  });

  const handleGoogleSignup = () => {
    router.push(`/api/auth/google?userType=${role}`);
  };

  useEffect(() => {
    // Ensure the role is correctly set in formData even if reloaded will not return to null/"" n the db.
    setFormData((prevData) => ({
      ...prevData,
      role: role,
    }));
  }, [role]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError("");
    setSuccessMessage("");

    try {
      // Parse the form data using the registerSchema
      registerSchema.parse(formData);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      // Check if the registration was successful
      if (res.ok) {
        console.log("Registration Data: ", formData);

        setSuccessMessage("Account successfully registered! Redirecting...");

        setTimeout(() => {
          router.push("/pages/auth/verify-email");
        }, 1000); // Redirect after 2 seconds

      } else if (data.error && data.error.includes("already registered")) {
        setError("This email is already registered. Please login.");
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      // Handle any validation errors thrown by Zod
      if (err instanceof z.ZodError) {
        const errorObj = err.errors.reduce((acc, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        }, {});
        setErrors(errorObj);
      } else {
        console.error("Error during API call:", err);
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Rentahan Logo</h1>
        <h1 className="text-2xl font-bold text-center mb-6">
          Register as {role}
        </h1>

        {/* Success or Error Message */}
        {successMessage && (
          <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Juan"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tamad"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="dob"
              className="block text-sm font-medium text-gray-700"
            >
              Date of Birth (MM/DD/YYYY)
            </label>
            <input
              type="date"
              id="dob"
              value={formData.dob}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:text-black"
              placeholder="MM/DD/YYYY"
            />

            {errors.dob && <p className="text-red-500 text-sm">{errors.dob}</p>}
          </div>

          <div>
            <label
              htmlFor="mobileNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Mobile Number
            </label>
            <input
              type="tel"
              id="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              onInput={(event) => {
                event.target.value = event.target.value.replace(/[^0-9]/g, "");
                handleChange(event); //ensure the change of value is still set using the handleChange function
              }}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="09XXXXXXXX"
            />
            {errors.mobileNumber && (
              <p className="text-red-500 text-sm">{errors.mobileNumber}</p>
            )}
          </div>

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
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
            )}
          </div>

          <p className="text-black">
            By signing up, you agree to our{" "}
            <a className="text-blue-900">Terms of Service</a> and{" "}
            <a className="text-blue-900">Privacy Policy</a>
          </p>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
          >
            Create Account
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="border-t border-gray-300 flex-grow"></div>
          <span className="mx-3 text-gray-500 font-medium">or</span>
          <div className="border-t border-gray-300 flex-grow"></div>
        </div>
        {/* Sign up with Google */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition"
        >
          <GoogleLogo />
          <span className="font-medium text-gray-700">Sign up with Google</span>
        </button>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="../auth/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
