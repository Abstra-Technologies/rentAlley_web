"use client";
import { useState } from "react";
import { Dialog } from "@headlessui/react";

export default function NameModal({
                                      isOpen,
                                      onClose,
                                      userId,
                                  }: {
    isOpen: boolean;
    onClose: () => void;
    userId: number;
}) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dob, setDob] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim() || !dob.trim()) {
            setError("All fields are required.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const res = await fetch("/api/user/updateProfile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, firstName, lastName, dob }),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            onClose(); // close modal after success
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
                    <Dialog.Title className="text-lg font-bold mb-4">
                        👋 Welcome Tenant
                    </Dialog.Title>
                    <p className="text-sm text-gray-600 mb-3">
                        Please enter your details to complete your account.
                    </p>

                    <input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    <input
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}
