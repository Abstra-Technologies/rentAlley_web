"use client";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import CardWarning from "../../../components/devTeam";
import { logEvent } from "@/src/utils/gtag";

export default function LoginAdmin() {
  const [form, setForm] = useState({ login: "", password: "" });
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockTime, setUnlockTime] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedLockTime = localStorage.getItem("lockUntil");
    if (storedLockTime) {
      const lockUntil = parseInt(storedLockTime, 10);
      const currentTime = Date.now();

      if (currentTime < lockUntil) {
        setIsLocked(true);
        setUnlockTime(lockUntil);
        startUnlockCountdown(lockUntil);
      } else {
        localStorage.removeItem("lockUntil");
      }
    }
  }, []);

  const startUnlockCountdown = (lockUntil) => {
    const interval = setInterval(() => {
      const timeLeft = lockUntil - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        setIsLocked(false);
        setUnlockTime(null);
        localStorage.removeItem("lockUntil");
        setAttempts(0);
      }
    }, 1000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLocked) {
      logEvent(
        "Login Attempt",
        "Security",
        "Locked Out - Too Many Attempts",
        1
      );
      await Swal.fire("Too many attempts", "Please try again later.", "error");
      return;
    }
    logEvent("Login Attempt", "User Interaction", "Admin Attempted Login", 1);

    try {
      const res = await fetch("/api/systemadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        logEvent("Login Success", "Authentication", "Admin Logged In", 1);

        setMessage("Login successful!");
        setAttempts(0);
        localStorage.removeItem("lockUntil");
        router.push("/pages/system_admin/dashboard");
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setMessage(data.error || "Invalid credentials.");
        logEvent(
          "Login Failed",
          "Authentication",
          "Admin Login Failed",
          newAttempts
        );

        if (newAttempts >= 3) {
          const lockDuration = 60000;
          const lockUntil = Date.now() + lockDuration;

          setIsLocked(true);
          setUnlockTime(lockUntil);
          localStorage.setItem("lockUntil", lockUntil);

          setMessage("Too many failed attempts. Please try again later.");
          startUnlockCountdown(lockUntil);
          logEvent(
            "Account Locked",
            "Security",
            "Admin Account Temporarily Locked",
            1
          );
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Something went wrong. Please try again.");
    }
  };

  const showForgotPasswordPopup = () => {
    Swal.fire({
      title: "Forgot Password?",
      text: "For security reasons, please contact support to reset your password.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Contact Support",
      cancelButtonText: "Close",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "mailto:bryan.lim@benilde.edu.ph";
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">
          Rentahan
        </h1>
        <h2 className="text-xl font-semibold text-center text-blue-500 mb-6">
          Admin Login
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="login"
              className="block text-sm font-medium text-gray-700"
            >
              Email or Username
            </label>
            <input
              id="login"
              type="text"
              name="login"
              placeholder="Enter email or username"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.login}
              onChange={handleChange}
              required
              disabled={isLocked}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Password"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.password}
              onChange={handleChange}
              required
              disabled={isLocked}
            />
          </div>

          <button
            type="submit"
            className={`w-full py-2 px-4 ${
              isLocked ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600"
            } text-white font-medium rounded-md ${
              !isLocked && "hover:bg-blue-700 transition"
            }`}
            disabled={isLocked}
          >
            {isLocked
              ? `Locked (${Math.max(
                  0,
                  Math.ceil((unlockTime - Date.now()) / 1000)
                )}s)`
              : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={showForgotPasswordPopup}
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        {message && (
          <p className="mt-4 text-center text-sm text-red-500">{message}</p>
        )}
      </div>
    </div>
  );
}
