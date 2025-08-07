"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface TwoFactorToggleProps {
    user_id: string;
}

const TwoFactorToggle = ({ user_id }: TwoFactorToggleProps) => {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetch2FAStatus = async () => {
        try {
            const res = await fetch(`/api/auth/get2faStatus?user_id=${user_id}`);
            const data = await res.json();
            setIs2FAEnabled(data.is_2fa_enabled);
        } catch (err) {
            console.error("Error fetching 2FA status", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetch2FAStatus();
    }, [user_id]);

    const handle2FAToggle = async () => {
        const newStatus = !is2FAEnabled;

        try {
            const res = await fetch("/api/auth/toggle2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id, enable_2fa: newStatus }),
                credentials: "include",
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire({
                    icon: "success",
                    title: "Success!",
                    text: data.message,
                });

                setIs2FAEnabled(newStatus);
                window.dispatchEvent(new Event("authChange"));
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error!",
                    text: "Failed to update 2FA setting.",
                });
            }
        } catch (error) {
            console.error("Error updating 2FA:", error);
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Something went wrong. Please try again later.",
            });
        }
    };

    if (loading) return <p className="text-sm text-gray-500">Loading 2FA status...</p>;

    return (
        <div className="mt-6">
            <h2 className="text-md font-semibold">Two-Factor Authentication</h2>
            <p className="text-sm text-gray-600">
                Enable or disable 2FA for added security.
            </p>
            <button
                onClick={handle2FAToggle}
                className={`mt-4 px-4 py-2 text-white rounded ${
                    is2FAEnabled ? "bg-red-600" : "bg-green-600"
                }`}
            >
                {is2FAEnabled ? "Disable 2FA" : "Enable 2FA"}
            </button>
        </div>
    );
};

export default TwoFactorToggle;
