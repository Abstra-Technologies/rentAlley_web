"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { logEvent } from "@/utils/gtag";

export default function LoginAdmin() {
    const router = useRouter();

    const [form, setForm] = useState({
        login: "",
        password: "",
    });

    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    /* ================= LOCK STATE ================= */
    useEffect(() => {
        const stored = localStorage.getItem("admin_lock_until");
        if (!stored) return;

        const lockUntil = Number(stored);
        if (Date.now() < lockUntil) {
            setIsLocked(true);
            startCountdown(lockUntil);
        } else {
            localStorage.removeItem("admin_lock_until");
        }
    }, []);

    const startCountdown = (lockUntil: number) => {
        const interval = setInterval(() => {
            const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
            if (remaining <= 0) {
                clearInterval(interval);
                setIsLocked(false);
                setRemainingSeconds(0);
                setAttempts(0);
                localStorage.removeItem("admin_lock_until");
            } else {
                setRemainingSeconds(remaining);
            }
        }, 1000);
    };

    /* ================= HANDLERS ================= */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLocked) {
            await Swal.fire({
                icon: "warning",
                title: "Account Locked",
                text: `Try again in ${remainingSeconds}s`,
            });
            return;
        }

        try {
            const res = await fetch("/api/systemadmin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });

            /* ================= SUCCESS (REDIRECT) ================= */
            if (res.redirected) {
                logEvent("Admin Login", "Authentication", "Success", 1);
                window.location.href = res.url;
                return;
            }

            /* ================= SUCCESS (JSON 200) ================= */
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                const redirectTo =
                    data.redirectTo || "/pages/system_admin/dashboard";

                logEvent("Admin Login", "Authentication", "Success", 1);
                window.location.href = redirectTo;
                return;
            }

            /* ================= FAILURE ================= */
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Invalid credentials");

        } catch (err: any) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            logEvent("Admin Login", "Authentication", "Failed", newAttempts);

            await Swal.fire({
                icon: "error",
                title: "Login Failed",
                text: err.message,
            });

            if (newAttempts >= 3) {
                const lockUntil = Date.now() + 60_000;
                setIsLocked(true);
                setRemainingSeconds(60);
                localStorage.setItem("admin_lock_until", String(lockUntil));
                startCountdown(lockUntil);
            }
        }
    };

    /* ================= UI ================= */
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
                <h1 className="mb-2 text-center text-3xl font-bold text-blue-600">
                    Upkyp Admin
                </h1>
                <p className="mb-6 text-center text-gray-600">
                    Secure Administrator Login
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">
                            Email or Username
                        </label>
                        <input
                            name="login"
                            required
                            disabled={isLocked}
                            value={form.login}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            disabled={isLocked}
                            value={form.password}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLocked}
                        className={`w-full rounded-lg py-3 font-bold text-white ${
                            isLocked
                                ? "bg-gray-400"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {isLocked ? `Locked (${remainingSeconds}s)` : "Login"}
                    </button>
                </form>

                {attempts > 0 && attempts < 3 && (
                    <p className="mt-4 text-center text-sm text-orange-600">
                        {3 - attempts} attempt(s) remaining
                    </p>
                )}
            </div>
        </div>
    );
}
