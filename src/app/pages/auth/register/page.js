"use client";

import GoogleLogo from "../../../../components/google-logo";
import Link from "next/link";
import { useState, useEffect } from "react";
import { z } from "zod";
import useRoleStore from "../../../../zustand/store";
import { useRouter } from "next/navigation";
import { logEvent } from "../../../../utils/gtag";
import Footer from "../../../../components/navigation/footer";
import Image from "next/image";
import Swal from "sweetalert2";

const registerSchema = z
  .object({
    firstName: z.string().nonempty("First Name is required"),
    lastName: z.string().nonempty("Last Name is required"),
    dob: z.string().nonempty("Date of Birth is required"),
    mobileNumber: z
      .string()
      .regex(/^\d{11}$/, "Mobile Number must be 11 digits"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be 6 characters long") 
      .refine(
        (value) => /^[a-zA-Z0-9]+$/.test(value), 
        "Password must contain only letters and numbers"
      ),

    confirmPassword: z
      .string()
      .min(6, "Confirm Password must be 6 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function Register() {
  const role = useRoleStore((state) => state.role);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    logEvent(
      "Login Attempt",
      "Google Sign-Up",
      "User Clicked Google Sign-Up",
      1
    );

    router.push(`/api/auth/google?userType=${role}`);
  };
  useEffect(() => {
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
    setLoading(true);
    setErrors({});

    for (const key in formData) {
      if (!formData[key].trim()) {
        Swal.fire("Error", "All fields are required", "error");
        setLoading(false);
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      Swal.fire("Error", "Passwords do not match", "error");
      setLoading(false);
      return;
    }

    try {
      registerSchema.parse(formData);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        Swal.fire("Success", "Account successfully registered!", "success");
        logEvent("Register", "Authentication", "Register Successful", 1);
        setTimeout(() => router.push("/pages/auth/verify-email"), 1500);
      } else {
        Swal.fire("Error", data.error || "Registration failed", "error");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorObj = err.errors.reduce((acc, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        }, {});
        setErrors(errorObj);
      } else {
        Swal.fire("Error", "An unexpected error occurred", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="relative flex items-center justify-center min-h-screen bg-gray-100 overflow-hidden">
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
        <h1 className="text-2xl font-bold text-center mb-6">
          Register as {role}
        </h1>

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
                handleChange(event); 
              }}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="09XXXXXXXXX"
            />
            
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

        
        <div className="flex items-center my-6">
          <div className="border-t border-gray-300 flex-grow"></div>
          <span className="mx-3 text-gray-500 font-medium">or</span>
          <div className="border-t border-gray-300 flex-grow"></div>
        </div>
        
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full py-2 px-4 border border-gray-300 rounded-md flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition"
        >
          <GoogleLogo />
          <span className="font-medium text-gray-700">Sign up with Google</span>
        </button>

        
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
     

   
   <Footer />
 </>
  );
}
