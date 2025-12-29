"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function VerifyOTP() {
    const [otp, setOtp] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const router = useRouter();

    /* ----------------------------------------
       TIMER (single source of truth)
    ---------------------------------------- */
    useEffect(() => {
        const expiry = sessionStorage.getItem("otp_expiry");

        if (expiry) {
            const remaining = Math.floor(
                (Number(expiry) - Date.now()) / 1000
            );
            setTimeLeft(remaining > 0 ? remaining : 0);
        }
    }, []);

    useEffect(() => {
        if (timeLeft <= 0) return;

        const interval = setInterval(() => {
            const expiry = sessionStorage.getItem("otp_expiry");
            if (!expiry) {
                setTimeLeft(0);
                return;
            }

            const remaining = Math.floor(
                (Number(expiry) - Date.now()) / 1000
            );

            if (remaining <= 0) {
                sessionStorage.removeItem("otp_expiry");
                setTimeLeft(0);
                clearInterval(interval);
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? "0" : ""}${sec}`;
    };

    /* ----------------------------------------
       VERIFY OTP
    ---------------------------------------- */
    const handleVerify = async () => {
        if (otp.length !== 6 || isNaN(Number(otp))) {
            toast.error("OTP must be a 6-digit number");
            return;
        }

        setVerifying(true);
        try {
            const res = await axios.post(
                "/api/auth/verify-otp-reg",
                { otp },
                { withCredentials: true }
            );

            toast.success(res.data.message);

            setTimeout(() => {
                if (res.data.userType === "tenant") {
                    router.push("/pages/tenant/feeds");
                } else {
                    router.push("/pages/landlord/dashboard");
                }
            }, 1500);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "OTP verification failed");
        } finally {
            setVerifying(false);
        }
    };

    /* ----------------------------------------
       RESEND OTP (authoritative reset)
    ---------------------------------------- */
    const handleResendOTP = async () => {
        if (timeLeft > 0) return;

        setResending(true);
        try {
            const res = await axios.post("/api/auth/resend-otp-reg");

            toast.info(res.data.message || "New OTP sent");

            if (res.data.expiresAt) {
                const expiryTime = new Date(res.data.expiresAt).getTime();
                sessionStorage.setItem("otp_expiry", expiryTime.toString());

                const remaining = Math.floor(
                    (expiryTime - Date.now()) / 1000
                );
                setTimeLeft(remaining > 0 ? remaining : 0);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to resend OTP");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-700 via-emerald-600 to-blue-900 px-4">
            <ToastContainer />

            <div className="w-full max-w-sm bg-white/95 p-6 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-bold text-center mb-2">
                    Verify Your Email
                </h2>

                <p className="text-center text-sm text-gray-600 mb-6">
                    Enter the 6-digit code sent to your email
                </p>

                <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    inputMode="numeric"
                    className="w-full text-center tracking-[0.5em] p-3 border rounded-xl mb-4"
                    placeholder="• • • • • •"
                />

                <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl"
                >
                    {verifying ? "Verifying..." : "Verify OTP"}
                </button>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Resend available in{" "}
                        <span className="font-semibold text-blue-600">
              {formatTime(timeLeft)}
            </span>
                    </p>

                    <button
                        onClick={handleResendOTP}
                        disabled={timeLeft > 0}
                        className={`w-full mt-3 py-2 rounded-xl ${
                            timeLeft > 0
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-gray-800 text-white"
                        }`}
                    >
                        {resending ? "Resending..." : "Resend OTP"}
                    </button>
                </div>
            </div>
        </div>
    );
}
