"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import { MailCheck, Clock, ArrowRightCircle } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

export default function VerifyEmail() {
    const [otp, setOtp] = useState("");
    const [timeLeft, setTimeLeft] = useState(0);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const router = useRouter();

    /* ---------------- TIMER ---------------- */
    useEffect(() => {
        const expiry = sessionStorage.getItem("otp_expiry");
        if (expiry) {
            const remaining = Math.floor((Number(expiry) - Date.now()) / 1000);
            setTimeLeft(remaining > 0 ? remaining : 0);
        }
    }, []);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const interval = setInterval(() => {
            const expiry = sessionStorage.getItem("otp_expiry");
            if (!expiry) return setTimeLeft(0);
            const remaining = Math.floor((Number(expiry) - Date.now()) / 1000);
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

    /* ---------------- VERIFY ---------------- */
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

            toast.success("Email verified successfully 🎉");

            setTimeout(() => {
                if (res.data.userType === "tenant") {
                    router.push("/pages/tenant/feeds");
                } else {
                    router.push("/pages/landlord/dashboard");
                }
            }, 1200);

        } catch (err: any) {
            toast.error(err.response?.data?.message || "Invalid OTP");
        } finally {
            setVerifying(false);
        }
    };

    /* ---------------- RESEND ---------------- */
    const handleResendOTP = async () => {
        if (timeLeft > 0) return;

        setResending(true);
        try {
            const res = await axios.post("/api/auth/resend-otp-reg");
            toast.info("New OTP sent");

            if (res.data.expiresAt) {
                const expiryTime = new Date(res.data.expiresAt).getTime();
                sessionStorage.setItem("otp_expiry", expiryTime.toString());
                setTimeLeft(Math.floor((expiryTime - Date.now()) / 1000));
            }
        } catch (err: any) {
            toast.error("Failed to resend OTP");
        } finally {
            setResending(false);
        }
    };

    /* ---------------- VERIFY LATER ---------------- */
    const handleVerifyLater = () => {
        toast.info("You can verify your email later from your profile settings.");
        router.push("/dashboard"); // Adjust based on userType if needed
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-emerald-600 to-blue-900 px-4">
            <ToastContainer />

            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-100 p-4 rounded-full">
                        <MailCheck className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-2">
                    Verify Your Email
                </h2>

                <p className="text-center text-gray-600 text-sm mb-6">
                    Enter the 6-digit code sent to your email address.
                </p>

                {/* OTP Input */}
                <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    inputMode="numeric"
                    className="w-full text-center tracking-[0.5em] p-4 border rounded-xl mb-4 text-lg font-semibold"
                    placeholder="••••••"
                />

                {/* Verify Button */}
                <button
                    onClick={handleVerify}
                    disabled={verifying}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold shadow-md hover:scale-[1.02] transition"
                >
                    {verifying ? "Verifying..." : "Verify Email"}
                </button>

                {/* Timer */}
                <div className="mt-6 text-center">
                    <div className="flex justify-center items-center gap-2 text-sm text-gray-500">
                        <Clock size={16} />
                        Resend in {formatTime(timeLeft)}
                    </div>

                    <button
                        onClick={handleResendOTP}
                        disabled={timeLeft > 0}
                        className={`mt-3 text-sm font-medium ${
                            timeLeft > 0
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-blue-600 hover:underline"
                        }`}
                    >
                        {resending ? "Resending..." : "Resend OTP"}
                    </button>
                </div>

                {/* Divider */}
                <div className="my-6 border-t" />

                {/* Verify Later */}
                <button
                    onClick={handleVerifyLater}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-2 transition"
                >
                    <ArrowRightCircle size={18} />
                    Verify Later
                </button>

                <p className="text-xs text-gray-400 text-center mt-4">
                    Some features may be limited until your email is verified.
                </p>
            </div>
        </div>
    );
}
