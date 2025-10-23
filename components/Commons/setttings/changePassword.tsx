"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
    userId: number | string;
}

const ChangePasswordModal = ({ userId }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    const passwordChecks = {
        length: newPassword.length >= 8,
        upper: /[A-Z]/.test(newPassword),
        lower: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[^A-Za-z0-9]/.test(newPassword),
    };

    const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;
    const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-600"];

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => {
        setIsOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    const handleSubmit = async () => {
        if (newPassword !== confirmPassword) {
            Swal.fire("Error", "New passwords do not match", "error");
            return;
        }

        if (passwordStrength < 4) {
            Swal.fire("Weak Password", "Please use a stronger password.", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.put(`/api/user/changePassword`, {
                user_id: userId,
                currentPassword,
                newPassword,
            });

            await Swal.fire({
                icon: "success",
                title: "Password Updated",
                text: "Your password was updated successfully. You’ll be logged out for security reasons.",
                confirmButtonText: "OK",
                confirmButtonColor: "#2563eb",
            });
            await axios.post("/api/auth/logout");
            router.replace("/pages/auth/login");
        } catch (error: any) {
            Swal.fire("Error", error?.response?.data?.message || "Failed to update password", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="mb-6">
                <p className="text-gray-600 mb-2">
                    For your account security, you can update your password below.
                </p>
                <button
                    onClick={handleOpen}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    Change Password
                </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white w-full max-w-md mx-auto rounded-lg shadow-lg p-6 relative animate-fadeIn">
                        <h2 className="text-lg font-semibold mb-4">Change Password</h2>

                        {/* Current Password */}
                        <div className="relative mb-3">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full border rounded px-3 py-2 pr-10"
                                placeholder="Current Password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* New Password */}
                        <div className="relative mb-3">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                className="w-full border rounded px-3 py-2 pr-10"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Password Strength */}
                        {newPassword && (
                            <div className="mb-3">
                                <div className="flex space-x-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-2 flex-1 rounded ${
                                                i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-gray-200"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <ul className="text-xs text-gray-600 space-y-1">
                                    <li className={passwordChecks.length ? "text-green-600" : ""}>
                                        • At least 8 characters
                                    </li>
                                    <li className={passwordChecks.upper ? "text-green-600" : ""}>
                                        • At least one uppercase letter
                                    </li>
                                    <li className={passwordChecks.lower ? "text-green-600" : ""}>
                                        • At least one lowercase letter
                                    </li>
                                    <li className={passwordChecks.number ? "text-green-600" : ""}>
                                        • At least one number
                                    </li>
                                    <li className={passwordChecks.special ? "text-green-600" : ""}>
                                        • At least one special character
                                    </li>
                                </ul>
                            </div>
                        )}

                        {/* Confirm Password */}
                        <div className="relative mb-4">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="w-full border rounded px-3 py-2 pr-10"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 transition"
                            >
                                {isSubmitting ? "Updating..." : "Change Password"}
                            </button>
                        </div>

                        <button
                            onClick={handleClose}
                            className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChangePasswordModal;
