"use client";

import GoogleLogo from "../../../../components/google-logo";
import Link from "next/link";
import {useState, useEffect, Suspense} from "react";
import { z } from "zod";
import useRoleStore from "../../../../zustand/store";
import {useRouter, useSearchParams} from "next/navigation";
import { logEvent } from "../../../../utils/gtag";
import Footer from "../../../../components/navigation/footer";
import Image from "next/image";

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
export default function RegisterPage() {
  return (
      <Suspense fallback={<div>Loading...</div>}>
        <Register />
      </Suspense>
  );
}

function Register() {
  const role = useRoleStore((state) => state.role);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const error_2 = searchParams.get("error");
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
    setErrors({});
    setError("");
    setSuccessMessage("");

    try {
      registerSchema.parse(formData);

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("Registration Data: ", formData);
        setSuccessMessage("Account successfully registered! Redirecting...");
        logEvent("Register", "Authentication", "Register Successful", 1);

        setTimeout(() => {
          router.push("/pages/auth/verify-email");
        }, 1000); // Redirect after 2 seconds
      } else if (data.error && data.error.includes("already registered")) {
        setError("This email is already registered. Please admin_login.");
      } else {
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
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
    <>
      <div className="relative flex items-center justify-center min-h-screen bg-gray-100 overflow-hidden px-4 sm:px-6 lg:px-8 py-16">
        <Image
          src="/images/hero-section.jpeg"
          alt="Cityscape view of high-rise buildings"
          fill
          className="absolute inset-0 object-cover brightness-75"
          priority
        />
        
        <div className="relative z-10 bg-white p-10 sm:p-12 rounded-2xl shadow-lg w-full max-w-2xl">
          <h1 className="text-4xl font-bold text-center text-blue-600 mb-4">
            Rentahan
          </h1>
          <h1 className="text-2xl font-semibold text-center mb-6">
            Register as {role}
          </h1>
  
          {successMessage && (
            <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
  
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {[
              { id: "firstName", label: "First Name", placeholder: "Juan" },
              { id: "lastName", label: "Last Name", placeholder: "Tamad" },
              { id: "dob", label: "Date of Birth", type: "date" },
              { id: "mobileNumber", label: "Mobile Number", placeholder: "09XXXXXXXXX", type: "tel" },
              { id: "email", label: "Email Address", placeholder: "juantamad@email.com", type: "email" },
              { id: "password", label: "Password", placeholder: "••••••••", type: "password" },
              { id: "confirmPassword", label: "Confirm Password", placeholder: "••••••••", type: "password" }
            ].map(({ id, label, placeholder, type = "text" }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                  {label}
                </label>
                <input
                  type={type}
                  id={id}
                  value={formData[id]}
                  onChange={handleChange}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={placeholder || ""}
                />
                {errors[id] && <p className="text-red-500 text-sm">{errors[id]}</p>}
              </div>
            ))}
  
            <p className="text-sm text-gray-700 text-center">
              By signing up, you agree to our <a className="text-blue-600 hover:underline">Terms of Service</a> and <a className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all"
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
            className="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition-all"
          >
            <GoogleLogo />
            <span className="ml-2 font-medium text-gray-700">Sign up with Google</span>
          </button>
          {error_2 && <p className="text-red-600 text-sm">{decodeURIComponent(error)}</p>}


          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <Link href="/pages/auth/login" className="text-blue-600 hover:underline font-medium">Login here</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
