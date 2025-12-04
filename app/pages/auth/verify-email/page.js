"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TIMER_DURATION = 5 * 60; // 5 minutes

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const router = useRouter();

  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // timer
  useEffect(() => {
    const storedExpiry = sessionStorage.getItem("otp_timer_expiry");
    if (storedExpiry) {
      const remainingTime = Math.floor(
        (parseInt(storedExpiry) - Date.now()) / 1000
      );
      if (remainingTime > 0) {
        setTimeLeft(remainingTime);
        return;
      }
    }
    resetTimer();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sessionStorage.removeItem("otp_timer_expiry");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const resetTimer = () => {
    setTimeLeft(TIMER_DURATION);
    sessionStorage.setItem(
      "otp_timer_expiry",
      Date.now() + TIMER_DURATION * 1000
    );
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleVerify = async () => {
    if (otp.length !== 6 || isNaN(otp)) {
      toast.error("OTP must be a 6-digit number");
      return;
    }
    setVerifying(true);
    try {
      const response = await axios.post(
          "/api/auth/verify-otp-reg",
          { otp },
          { withCredentials: true }
      );
      toast.success(response.data.message);
      const userType = response.data.userType;

      setTimeout(() => {
        if (userType === "tenant") {
          window.location.href = "/pages/tenant/feeds";
        } else if (userType === "landlord") {
          window.location.href = "/pages/landlord/dashboard";
        }
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    }
    setVerifying(false);
  };

  const handleResendOTP = async () => {
    if (timeLeft > 0) return;
    setResending(true);
    try {
      const response = await axios.post("/api/auth/resend-otp-reg");
      toast.info(response.data.message || "New OTP sent. Check your email.");

      // 🔹 Sync timer with backend if available
      if (response.data.expiresAt) {
        const expiryTime = new Date(response.data.expiresAt).getTime();
        const remaining = Math.floor((expiryTime - Date.now()) / 1000);
        setTimeLeft(remaining > 0 ? remaining : 0);
        sessionStorage.setItem("otp_timer_expiry", expiryTime.toString());
      } else {
        resetTimer();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    }
    setResending(false);
  };


    return (
        <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-700 via-emerald-600 to-blue-900 px-4">
            <ToastContainer />

            <div className="w-full max-w-sm bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/30">
                <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
                    Verify Your Email
                </h2>

                <p className="text-gray-600 text-sm text-center mb-6">
                    Enter the 6-digit code sent to your email.
                </p>

                {/* OTP Input */}
                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="• • • • • •"
                    className="w-full p-3 text-center tracking-[0.5em] text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl transition-all mb-4"
                    maxLength="6"
                    inputMode="numeric"
                />

                {/* Verify Button */}
                <button
                    onClick={handleVerify}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all active:scale-[0.98]"
                    disabled={verifying}
                >
                    {verifying ? "Verifying..." : "Verify OTP"}
                </button>

                {/* Timer + Resend */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">Didn’t receive the code?</p>

                    <p className="text-sm text-gray-800 font-medium mt-1">
                        Resend available in{" "}
                        <span className="text-blue-600">{formatTime(timeLeft)}</span>
                    </p>

                    <button
                        onClick={handleResendOTP}
                        className={`w-full mt-3 py-2.5 rounded-xl text-sm font-medium transition-all
            ${
                            timeLeft > 0
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-gray-800 text-white hover:bg-black active:scale-[0.98]"
                        }
          `}
                        disabled={timeLeft > 0}
                    >
                        {resending ? "Resending..." : "Resend OTP"}
                    </button>
                </div>
            </div>
        </div>
    );

}
