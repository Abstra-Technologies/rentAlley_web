"use client";

import GoogleLogo from "../../../../components/google-logo";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { z } from "zod";
import useRoleStore from "../../../../zustand/store";
import { useRouter, useSearchParams } from "next/navigation";
import { logEvent } from "../../../../utils/gtag";
import Page_footer from "../../../../components/navigation/page_footer";
import Image from "next/image";
import Swal from "sweetalert2";

const registerSchema = z
    .object({
      email: z.string().email("Invalid email address"),
      password: z
          .string()
          .min(8, "Password must be at least 8 characters long")
          .refine(
              (value) => /^[\w!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/.test(value),
              "Password contains invalid characters"
          ),
      confirmPassword: z.string().min(8, "Confirm Password must be the same."),
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
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const error_2 = searchParams.get("error");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: role,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleCheckboxChange = (e) => {
    setAgreeToTerms(e.target.checked);
  };

  const handleGoogleSignup = () => {
    logEvent("Login Attempt", "Google Sign-Up", "User Clicked Google Sign-Up", 1);
    router.push(`/api/auth/googleSignUp?userType=${role}`);
  };

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      role: role,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

    try {
      registerSchema.parse(formData);

      if (!agreeToTerms) {
        Swal.fire({
          icon: "error",
          title: "Terms Not Accepted",
          text: "You must agree to the Terms of Service and Privacy Policy before registering.",
          confirmButtonText: "OK",
        });
        return;
      }

      Swal.fire({
        title: "Registering...",
        text: "Please wait while we process your registration.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          title: "Success!",
          text: "Account successfully registered! Redirecting...",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => router.push("/pages/auth/verify-email"));
      } else if (data.error && data.error.includes("already")) {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "This email is already registered. Please log in.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Registration Failed!",
          text: data.error || "Please try again.",
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorObj = err.errors.reduce((acc, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        }, {});
        setErrors(errorObj);
        Swal.fire({
          icon: "error",
          title: "Validation Error!",
          text: "Please check your input fields.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Unexpected Error!",
          text: "An unexpected error occurred. Please try again.",
        });
      }
    }
  };

  return (
      <>
        <div className="min-h-screen flex flex-col lg:flex-row">
          {/* Left Hero Image */}
          <div className="hidden lg:flex flex-1 relative">
            <Image
                src="/images/hero-section.jpeg"
                alt="Cityscape view of high-rise buildings"
                fill
                className="object-cover brightness-75"
                priority
            />
          </div>

          {/* Form Container */}
          <div className="flex-1 flex justify-center items-center relative bg-gray-100 lg:bg-white">
            <div className="absolute inset-0 lg:hidden">
              <Image
                  src="/images/hero-section.jpeg"
                  alt="Cityscape view of high-rise buildings"
                  fill
                  className="object-cover brightness-75"
                  priority
              />
            </div>

            <div className="relative z-10 w-full mt-2 mb-2 max-w-lg sm:max-w-2xl mx-4 sm:mx-auto p-6 sm:p-10 bg-white rounded-2xl shadow-lg">
              <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-600 mb-4">
                Upkyp
              </h1>
              <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6">
                Register as {role}
              </h2>

              {error && (
                  <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm sm:text-base">
                    {error}
                  </div>
              )}

              <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                {/* New name fields */}
                <div>
                  <label
                      htmlFor="firstName"
                      className="block text-sm sm:text-base font-medium text-gray-700"
                  >
                    First Name
                  </label>
                  <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      placeholder="Juan"
                  />
                </div>

                <div>
                  <label
                      htmlFor="lastName"
                      className="block text-sm sm:text-base font-medium text-gray-700"
                  >
                    Last Name
                  </label>
                  <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                      placeholder="Dela Cruz"
                  />
                </div>

                {/* Existing fields */}
                {[
                  {
                    id: "email",
                    label: "Email Address",
                    placeholder: "juan@email.com",
                    type: "email",
                  },
                  {
                    id: "password",
                    label: "Password",
                    placeholder: "••••••••",
                    type: "password",
                  },
                  {
                    id: "confirmPassword",
                    label: "Confirm Password",
                    placeholder: "••••••••",
                    type: "password",
                  },
                ].map(({ id, label, placeholder, type }) => (
                    <div key={id}>
                      <label
                          htmlFor={id}
                          className="block text-sm sm:text-base font-medium text-gray-700"
                      >
                        {label}
                      </label>
                      <input
                          type={type}
                          id={id}
                          value={formData[id]}
                          onChange={handleChange}
                          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                          placeholder={placeholder}
                      />
                      {errors[id] && (
                          <p className="text-red-500 text-xs sm:text-sm mt-1">
                            {errors[id]}
                          </p>
                      )}
                    </div>
                ))}

                <div className="flex items-center text-xs sm:text-sm text-gray-700">
                  <input
                      type="checkbox"
                      id="terms"
                      checked={agreeToTerms}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="terms" className="ml-2">
                    By signing up, you agree to our{" "}
                    <Link
                        href="/pages/terms-services"
                        className="text-blue-600 hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="/pages/terms-services"
                        className="text-blue-600 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>

                <button
                    type="submit"
                    className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all text-sm sm:text-base"
                >
                  Create Account
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="border-t border-gray-300 flex-grow"></div>
                <span className="mx-3 text-gray-500 font-medium text-sm sm:text-base">
                or
              </span>
                <div className="border-t border-gray-300 flex-grow"></div>
              </div>

              {/* Google Signup */}
              <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition-all"
              >
                <GoogleLogo />
                <span className="ml-2 font-medium text-gray-700 text-sm sm:text-base">
                Sign up with Google
              </span>
              </button>

              {error_2 && (
                  <p className="text-red-600 text-sm mt-2">
                    {decodeURIComponent(error_2)}
                  </p>
              )}

              <p className="mt-6 text-center text-sm sm:text-base text-gray-500">
                Already have an account?{" "}
                <Link
                    href="/pages/auth/login"
                    className="text-blue-600 hover:underline font-medium"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>

        <Page_footer />
      </>
  );
}

