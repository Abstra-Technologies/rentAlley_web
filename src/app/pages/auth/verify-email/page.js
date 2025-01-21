"use client";

import { useState } from "react";
import { z } from "zod";

const emailVerificationSchema = z.object({
  digits: z
    .array(z.string().regex(/^\d$/, "Each input must be a single digit"))
    .length(4, "All 4 digits are required"),
});

export default function VerifyEmail() {
  const [email, setEmail] = useState(["", "", "", ""]);
  const [error, setError] = useState("");

  const handleInputChange = (value, index) => {
    if (/^\d?$/.test(value)) {
      const newEmail = [...email];
      newEmail[index] = value;
      setEmail(newEmail);

      // Automatically move to the next input if a digit is entered
      if (value && index < 3) {
        const nextInput = document.getElementById(`email-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === "Backspace" && !email[index] && index > 0) {
      const prevInput = document.getElementById(`email-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    try {
      // Validate the input data
      emailVerificationSchema.parse({ digits: email });
      setError("");
      console.log("Verification Code:", email.join(""));
      // Handle successful submission (e.g., API call)
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-2xl p-8 max-w-sm w-full">
        {/* Rentahan Logo */}
        <h1 className="text-2xl text-center text-gray-800 mb-6">
          Rentahan Logo
        </h1>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Verify Account!
        </h2>
        <p className="text-sm text-gray-600 text-center mb-8">
          Enter the 4-digit code sent to your email.
        </p>

        {/* Email Inputs */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {email.map((digit, index) => (
            <input
              key={index}
              id={`email-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleInputChange(e.target.value, index)}
              onKeyDown={(e) => handleBackspace(e, index)}
              className="w-12 h-12 text-center text-2xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700"
        >
          Verify Email
        </button>

        <p className="text-sm text-gray-600 text-center mt-6">
          Didn&#39;t receive the code?{" "}
          <a href="#" className="text-blue-600 font-semibold hover:underline">
            Resend Code
          </a>
        </p>
      </div>
    </div>
  );
}
