"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {bugTypes} from "../../constant/bugTypes";// Import the bugTypes constant

export default function BugReportForm({ userID }: { userID: string }) {
    const [bugType, setBugType] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/bug-report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userID, bugType, subject, description }),
            });

            if (response.ok) {
                setMessage("Bug report submitted successfully.");
                setBugType("");
                setSubject("");
                setDescription("");
                router.refresh();
            } else {
                setMessage("Failed to submit bug report. Please try again.");
            }
        } catch (error) {
            setMessage("An error occurred. Please try again later.");
        }

        setLoading(false);
    };

    return (
        <div className="bg-gray-100 p-6 rounded-lg shadow-md w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Report a Bug</h2>
            {message && <p className="text-green-600 mb-2">{message}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col">
                <label className="mb-2 font-medium">Bug Type:</label>
                <select
                    value={bugType}
                    onChange={(e) => setBugType(e.target.value)}
                    className="border p-2 rounded-md mb-3"
                    required
                >
                    <option value="" disabled>Select Bug Type</option>
                    {bugTypes.map((type, index) => (
                        <option key={index} value={type.value}>
                            {type.value}
                        </option>
                    ))}
                </select>

                <label className="mb-2 font-medium">Subject:</label>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="border p-2 rounded-md mb-3"
                    required
                />

                <label className="mb-2 font-medium">Description:</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border p-2 rounded-md mb-3 h-24"
                    required
                ></textarea>

                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-md"
                    disabled={loading}
                >
                    {loading ? "Submitting..." : "Submit Bug Report"}
                </button>
            </form>
        </div>
    );
}
