// Add  Confirm new Password part. and validation.

'use client';
import {useEffect, useState} from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { logEvent } from "../../../../utils/gtag";
import { useRouter } from "next/navigation"; // Import Next.js router

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // Default step

  // Ensure localStorage is accessed only on the client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedStep = Number(localStorage.getItem("forgotPasswordStep"));
      if (storedStep) setStep(storedStep);
    }
  }, []);

  // Save step to localStorage only on the client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("forgotPasswordStep", step);
    }
  }, [step]);

  // Reset process when user navigates away
  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("forgotPasswordStep");
      }
    };

    router.prefetch("/pages/auth/login"); //Prefetch login page for faster navigation
    router.events?.on("routeChangeStart", handleRouteChange);

    return () => {
      router.events?.off("routeChangeStart", handleRouteChange);
    };
  }, [router]);

  const handleEmailSubmit = async () => {
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-request", { email });
      toast.success("OTP sent to your email. Enter OTP to proceed.");
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send OTP.");
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/auth/verify-otp-reset", { email, otp });
      setResetToken(response.data.resetToken);
      toast.success("OTP verified. Set your new password.");
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP.");
    }
    setLoading(false);
  };

  const [resendLoading, setResendLoading] = useState(false);

  const handleResendOTP = async () => {
    if (resendLoading) return;

    setResendLoading(true);
    try {
      const response = await axios.post("/api/auth/resend-otp-password", { email });
      toast.success(response.data.message || "New OTP sent to your email.");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to resend OTP.");
    }
    setResendLoading(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { resetToken, newPassword });
      toast.success("Password reset successfully! Redirecting...");
      if (typeof window !== "undefined") {
        localStorage.removeItem("forgotPasswordStep");
      }
      setTimeout(() => router.push("/pages/auth/login"), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Password reset failed.");
    }
    setLoading(false);
  };

  return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <ToastContainer />
        <div className="bg-white p-6 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>

          {step === 1 && (
              <>
                <p className="text-gray-600 text-sm text-center mb-4">
                  Enter your email to receive an OTP.
                </p>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="w-full p-2 border rounded-md mb-2 text-center"
                    required
                />
                <button
                    onClick={handleEmailSubmit}
                    className="w-full p-2 bg-blue-600 text-white rounded-md"
                    disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Next"}
                </button>
              </>
          )}

          {step === 2 && (
              <>
                <h3 className="text-lg font-semibold mt-4 text-center">Enter OTP</h3>
                <p className="text-gray-600 text-sm text-center mb-4">
                  A 6-digit OTP has been sent to your email.
                </p>

                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full p-2 border rounded-md mb-2 text-center"
                    maxLength="6"
                    required
                />

                <button
                    onClick={handleVerifyOTP}
                    className="w-full p-2 bg-green-600 text-white rounded-md"
                    disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                {/* ✅ Add Resend OTP Button Below */}
                <p className="text-center text-sm text-gray-500 mt-3">
                  Didn't receive an OTP?{" "}
                  <button
                      onClick={handleResendOTP}
                      className="text-blue-600 font-medium hover:underline"
                      disabled={resendLoading}
                  >
                    {resendLoading ? "Resending..." : "Resend OTP"}
                  </button>
                </p>
              </>
          )}


          {step === 3 && (
              <>
                <h3 className="text-lg font-semibold mt-4 text-center">Set New Password</h3>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-2 border rounded-md mb-2 text-center"
                    required
                />
                <button
                    onClick={handleResetPassword}
                    className="w-full p-2 bg-green-600 text-white rounded-md"
                    disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </>
          )}
        </div>
      </div>
  );
}