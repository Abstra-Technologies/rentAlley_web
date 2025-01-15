/**
 *
 * TODO:
 *  1. Show a prompt/message to show that he user successfully registered an account.
 *  2. In scenarios of the user have an account already do the same.
 *
 *
 *  Note:
 *  console.log are use for debugging to check if the data are passed correctly.
 *
 */



"use client";

import GoogleLogo from "../../../../components/google-logo";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import useRoleStore from "../../../../pages/zustand/store";
import { useRouter } from 'next/navigation';

const schema = z
  .object({
    firstName: z.string().min(2, "First Name is required"),
    lastName: z.string().min(2, "Last Name is required"),
    dob: z.string().nonempty("Date of Birth is required"),
    mobileNumber: z
      .string()
      .regex(/^\d{12}$/, "Mobile Number must be 12 digits"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password is at least 6 characters")
      .refine(
        (value) => /^[a-zA-Z0-9]+$/.test(value),
        "Password must be alphanumeric"
      ),
    confirmPassword: z
      .string()
      .min(6, "Confirm Password is at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords Do not match",
    path: ["confirmPassword"],
  });

export default function Register() {
  const role = useRoleStore((state) => state.role);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
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

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {

    const res = await fetch('/api/auth/register', {
      method: "POST",
      headers:{
        'content-type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    schema.parse(formData);

    if(res.ok){
      // after success. redirect to the email verification page
      router.push('/pages/auth/verify-email');
    }else{
      console.error("Error response:", res);
      setError(data.error || 'Registration failed');
    }

    } catch (err) {
      if (err.errors) {
        console.error("Error during API call:", error);
        const errorObj = err.errors.reduce((acc, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        }, {});
        setErrors(errorObj);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Rentahan Logo</h1>
        <h1 className="text-2xl font-bold text-center mb-6">Register as {role}</h1>

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
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition"
        >
          <GoogleLogo/>
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
