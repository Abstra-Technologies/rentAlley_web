"use client";
/**
 * TODO:
 * 1. Redesign this as it would email verification not otp.
 *
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Verifying...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("Waiting for verify email");
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/confirm-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("Email verified successfully! Redirecting...");
          setTimeout(() => {
            router.push("/pages/auth/login");
          }, 3000);
        } else {
          setStatus(data.error || "Email verification failed.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100">
      <div className="bg-white shadow-lg rounded-lg p-8 text-center max-w-md">
        <h2 className="text-3xl font-bold mb-6">Verify Your Email</h2>
        <p className="text-gray-700 mb-4">
          We’ve sent a verification email to your inbox. Please click on the
          link in the email to verify your account.
        </p>
        {isLoading ? (
          <div className="mt-6">
            <p className="text-gray-600">Verifying your email...</p>
            <div className="mt-4">
              <svg
                className="animate-spin h-8 w-8 text-indigo-600 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3V4a8 8 0 110 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                ></path>
              </svg>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <p className="text-green-600 font-semibold">{status}</p>
            <p className="text-gray-600 mt-2">
              You may close this page after verification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
