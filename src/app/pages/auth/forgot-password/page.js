"use client";

import { useState } from "react";
import axios from "axios";

/*
TODO:
REDESIGN THIS:

1. User enters email only - DONE
2. received email link to reset password. - DONE
3. redirects to reset password page. - DONE

 */

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Send a POST request to the backend to initiate the password reset process
      const { data } = await axios.post("/api/auth/reset-request", { email });

      // Display success message
      setMessage(data.message);
    } catch (err) {
      // Handle specific error for unregistered email
      if (err.response?.data?.error === "Email not registered") {
        setError("This email is not registered. Please sign up.");
      } else {
        setError(
          err.response?.data?.message || "An error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-sm w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Forgot Password?
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your email address below, and we’ll send you a link to reset
          your password.
        </p>

        {/* Forgot Password Form */}
        <form onSubmit={handleForgotPassword} className="space-y-6">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* Feedback Messages */}
        {message && (
          <p className="mt-4 text-center text-sm text-green-600">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}

        {/* Back to Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <a
              href="/pages/auth/login"
              className="text-blue-600 hover:underline"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
