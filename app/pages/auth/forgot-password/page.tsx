"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import Page_footer from "../../../../components/navigation/page_footer";
import Image from "next/image";
import {
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  ArrowLeft,
} from "lucide-react";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedStep = Number(sessionStorage.getItem("forgotPasswordStep"));
      if (storedStep) setStep(storedStep);

      const storedEmail = sessionStorage.getItem("forgotPasswordEmail");
      if (storedEmail) setEmail(storedEmail);

      const countdownEnd = Number(sessionStorage.getItem("otpCountdownEnd"));
      if (countdownEnd) {
        const remaining = countdownEnd - Date.now();
        if (remaining > 0) setTimer(Math.floor(remaining / 1000));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("forgotPasswordStep", step.toString());
    }
  }, [step]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

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

      sessionStorage.setItem("forgotPasswordEmail", email);

      const countdownEnd = Date.now() + 10 * 60 * 1000;
      sessionStorage.setItem("otpCountdownEnd", countdownEnd.toString());
      setTimer(10 * 60);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send OTP.");
    }
    setLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendLoading || timer > 0) return;

    setResendLoading(true);
    try {
      const response = await axios.post("/api/auth/resend-otp-password", {
        email,
      });
      toast.success(response.data.message || "New OTP sent to your email.");
      const countdownEnd = Date.now() + 10 * 60 * 1000;
      sessionStorage.setItem("otpCountdownEnd", countdownEnd.toString());
      setTimer(10 * 60);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to resend OTP.");
    }
    setResendLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/api/auth/verify-otp-reset", {
        email,
        otp,
      });
      setResetToken(response.data.resetToken);
      toast.success("OTP verified. Set your new password.");
      setStep(3);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid OTP.");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      toast.error("Missing reset token.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "/api/auth/reset-password",
        { resetToken, newPassword },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success("Password reset successfully! Redirecting...");
      sessionStorage.clear();
      setTimeout(() => router.push("/pages/auth/login"), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Password reset failed.");
    }
    setLoading(false);
  };

  return (
    <div className="relative flex flex-col min-h-[115vh] bg-gradient-to-br from-blue-900 via-emerald-700 to-emerald-500 overflow-hidden">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Background */}
      <Image
        src="/images/hero-section.jpeg"
        alt="UpKyp background"
        fill
        priority
        className="object-cover brightness-75"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-emerald-800/70 to-emerald-600/70" />

      {/* Main Section */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-center flex-1 px-4 sm:px-6 py-20 lg:py-28 gap-6 lg:gap-10">
        {/* Hero Text (Desktop only) */}
        <div className="hidden lg:block text-white max-w-lg text-center lg:text-left space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow-lg">
            Reset Your Password
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400 mt-2">
              Secure & Simple
            </span>
          </h1>
          <p className="text-base sm:text-lg lg:text-base text-gray-100">
            Get back to managing your properties in just a few steps.
          </p>
        </div>

        {/* Desktop Form */}
        <div className="hidden sm:block w-full max-w-sm lg:max-w-sm bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-5 lg:p-6 border border-white/30">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Forgot Password
            </h2>
            <p className="text-xs text-gray-600">
              {step === 1 && "Reset your password in a few simple steps"}
              {step === 2 && "Verify your identity"}
              {step === 3 && "Create a new secure password"}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-xs transition-all ${
                  step >= 1
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
              </div>

              <div
                className={`w-12 h-1 rounded-full transition-all ${
                  step >= 2
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600"
                    : "bg-gray-200"
                }`}
              />

              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-xs transition-all ${
                  step >= 2
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > 2 ? <CheckCircle className="w-4 h-4" /> : "2"}
              </div>

              <div
                className={`w-12 h-1 rounded-full transition-all ${
                  step >= 3
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600"
                    : "bg-gray-200"
                }`}
              />

              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-xs transition-all ${
                  step >= 3
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                3
              </div>
            </div>
          </div>

          {/* STEP 1: Email Input */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border-2 rounded-lg text-sm bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <button
                onClick={handleEmailSubmit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  onClick={() => router.push("/pages/auth/login")}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-blue-900">
                      Verification Code Sent
                    </p>
                    <p className="text-[10px] text-blue-700 mt-0.5">
                      A 6-digit OTP has been sent to{" "}
                      <span className="font-semibold">{email}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full px-3 py-2 border-2 rounded-lg text-center text-xl font-bold tracking-widest bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  maxLength={6}
                  required
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify OTP
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center">
                {timer > 0 ? (
                  <p className="text-xs text-gray-600">
                    Resend available in{" "}
                    <span className="font-bold text-blue-600">
                      {Math.floor(timer / 60)}:
                      {String(timer % 60).padStart(2, "0")}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">
                    Didn't receive an OTP?{" "}
                    <button
                      onClick={handleResendOTP}
                      disabled={resendLoading}
                      className="text-blue-600 font-semibold hover:text-blue-700 hover:underline disabled:opacity-50"
                    >
                      {resendLoading ? "Sending..." : "Resend OTP"}
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: New Password */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-900">
                      Verification Successful
                    </p>
                    <p className="text-[10px] text-emerald-700 mt-0.5">
                      Now create a strong password for your account
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 pr-10 border-2 rounded-lg text-sm bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Must be at least 8 characters long
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 pr-10 border-2 rounded-lg text-sm bg-white/80 border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {confirmPassword && (
                <div
                  className={`flex items-center gap-2 text-xs ${
                    newPassword === confirmPassword
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {newPassword === confirmPassword ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      Passwords do not match
                    </>
                  )}
                </div>
              )}

              <button
                onClick={handleResetPassword}
                disabled={
                  loading ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 8
                }
                className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Form */}
        <div className="sm:hidden w-full max-w-xs mx-auto bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-3 border border-white/30 mt-10">
          {/* Mobile Header */}
          <div className="text-center mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-base font-bold text-gray-800">
              Forgot Password
            </h2>
            <p className="text-gray-600 text-xs mt-0.5">
              {step === 1 && "Reset in a few steps"}
              {step === 2 && "Verify your identity"}
              {step === 3 && "Create new password"}
            </p>
          </div>

          {/* Mobile Progress */}
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center gap-1.5">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full font-semibold text-[10px] transition-all ${
                  step >= 1
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > 1 ? <CheckCircle className="w-3 h-3" /> : "1"}
              </div>
              <div
                className={`w-8 h-0.5 rounded-full ${
                  step >= 2
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600"
                    : "bg-gray-200"
                }`}
              />
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full font-semibold text-[10px] transition-all ${
                  step >= 2
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > 2 ? <CheckCircle className="w-3 h-3" /> : "2"}
              </div>
              <div
                className={`w-8 h-0.5 rounded-full ${
                  step >= 3
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600"
                    : "bg-gray-200"
                }`}
              />
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full font-semibold text-[10px] transition-all ${
                  step >= 3
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                3
              </div>
            </div>
          </div>

          {/* Mobile STEP 1 */}
          {step === 1 && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-2.5 py-1.5 border-2 rounded-lg text-xs bg-white/80 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleEmailSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold py-1.5 rounded-lg text-xs shadow-sm disabled:opacity-50"
              >
                {loading ? "Sending..." : "Next"}
              </button>

              <div className="text-center">
                <button
                  onClick={() => router.push("/pages/auth/login")}
                  className="text-[10px] text-blue-600 hover:text-blue-800"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}

          {/* Mobile STEP 2 */}
          {step === 2 && (
            <div className="space-y-2.5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-[10px] font-semibold text-blue-900">
                  OTP sent to {email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-2.5 py-1.5 border-2 rounded-lg text-center text-lg font-bold tracking-widest bg-white/80 border-gray-200 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold py-1.5 rounded-lg text-xs shadow-sm disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>

              <div className="text-center text-[10px] text-gray-600">
                {timer > 0 ? (
                  <span>
                    Resend in {Math.floor(timer / 60)}:
                    {String(timer % 60).padStart(2, "0")}
                  </span>
                ) : (
                  <>
                    Didn't receive?{" "}
                    <button onClick={handleResendOTP} className="text-blue-600">
                      Resend
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mobile STEP 3 */}
          {step === 3 && (
            <div className="space-y-2.5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                <p className="text-[10px] font-semibold text-emerald-900">
                  Verified! Create new password
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-2.5 py-1.5 border-2 rounded-lg text-xs bg-white/80 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Confirm
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-2.5 py-1.5 border-2 rounded-lg text-xs bg-white/80 border-gray-200 focus:border-emerald-500"
                />
              </div>

              {confirmPassword && (
                <p
                  className={`text-[10px] ${
                    newPassword === confirmPassword
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {newPassword === confirmPassword
                    ? "✓ Passwords match"
                    : "✗ Don't match"}
                </p>
              )}

              <button
                onClick={handleResetPassword}
                disabled={
                  loading ||
                  newPassword !== confirmPassword ||
                  newPassword.length < 8
                }
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold py-1.5 rounded-lg text-xs shadow-sm disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          )}
        </div>
      </main>

      <Page_footer />
    </div>
  );
}
