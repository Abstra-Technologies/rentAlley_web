"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function Verify2FA() {
    const searchParams = useSearchParams();
    const user_id = searchParams.get("user_id");
    const router = useRouter();

    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        // ✅ Prevent accessing this page if no pending 2FA session
        if (!sessionStorage.getItem("pending_2fa")) {
            router.push("/pages/auth/login"); // Redirect to login
        }

        // ✅ Prevent forward navigation to OTP page after going back
        window.history.pushState(null, null, window.location.href);
        window.onpopstate = () => {
            sessionStorage.removeItem("pending_2fa");
            router.push("/pages/auth/login");
        };
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("/api/auth/verify-2fa-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id, otp }),
                credentials: "include",
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire("Success", "OTP verified successfully!", "success");
                sessionStorage.removeItem("pending_2fa"); // ✅ Remove after successful login

                // ✅ Redirect based on user type
                if (data.user.userType === "tenant") {
                    router.push("/pages/tenant/dashboard");
                } else if (data.user.userType === "landlord") {
                    router.push("/pages/landlord/dashboard");
                } else {
                    setMessage("Invalid user type.");
                }
            } else {
                setMessage(data.error || "Invalid OTP.");
            }
        } catch (error) {
            console.error("Error:", error);
            setMessage("Something went wrong.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6">Enter OTP</h1>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        className="w-full border p-2 rounded"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                    />
                    <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded">
                        Verify OTP
                    </button>
                </form>
                {message && <p className="mt-4 text-center text-sm text-red-500">{message}</p>}
            </div>
        </div>
    );
}
