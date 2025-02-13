// To Do
//  1. Login Success and Error Message must be consistent across all login/regiser.
//  2. Redeign if possible for login attempts.

'use client'
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter} from "next/navigation";
import CardWarning from "../../../components/devTeam";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockTime, setUnlockTime] = useState(null);
const router = useRouter();

  useEffect(() => {
    // this is for check the attempt for incorrect password entered.
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
      await Swal.fire("Too many attempts", "Please try again later.", "error");
      return;
    }

    try {
      const res = await fetch("/api/systemadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Login successful!");
        setAttempts(0); // Reset attempts on success
        localStorage.removeItem("lockUntil");
        router.push("/pages/system_admin/dashboard");
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setMessage(data.error || "Invalid admin_login credentials.");

        if (newAttempts >= 3) {
          const lockDuration = 60000;
          const lockUntil = Date.now() + lockDuration;

          setIsLocked(true);
          setUnlockTime(lockUntil);
          localStorage.setItem("lockUntil", lockUntil);

          setMessage("Too many failed attempts. Please try again later.");
          startUnlockCountdown(lockUntil);
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
        window.location.href = "mailto:bryan.lim@benilde.edu.ph"; // Replace with actual support email
      }
    });
  };

  return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
          <CardWarning/>
          <h1 className="text-2xl font-bold text-center mb-6">
            Rentahan Admin Portal
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                  type="text"
                  name="email"
                  placeholder="email"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.email}
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
            {/*button will be disabled base on the attempts made.*/}
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
                  ? `Locked (${Math.max(0, Math.ceil((unlockTime - Date.now()) / 1000))}s)`
                  : "Login"}
            </button>
          </form>

          <button
              onClick={showForgotPasswordPopup}
              className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Forgot Password?
          </button>

          {message && (
              <p className="mt-4 text-center text-sm text-red-500">{message}</p>
          )}
        </div>
      </div>
  );
}