"use client";

import { useState } from "react";
import Swal from "sweetalert2";

interface FeedbackFormProps {
    landlord_id: number;
    review_id?: number; // optional, if you use Review linkage
    agreement_id: string | number;
    onFeedbackSubmitted: () => void;
}

export default function FeedbackForm({
                                         landlord_id,
                                         review_id,
                                         agreement_id,
                                         onFeedbackSubmitted,
                                     }: FeedbackFormProps) {
    const [feedbackText, setFeedbackText] = useState("");
    const [loading, setLoading] = useState(false);

    const submitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!feedbackText.trim()) {
            Swal.fire("Error", "Please write your feedback before submitting.", "error");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch("/api/tenant/activeRent/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    landlord_id,
                    review_id: review_id ?? null,
                    agreement_id,
                    feedback_text: feedbackText.trim(),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                Swal.fire({
                    icon: "success",
                    title: "Feedback Sent!",
                    text: "Your feedback has been submitted successfully.",
                    confirmButtonColor: "#10B981",
                });
                setFeedbackText("");
                onFeedbackSubmitted();
            } else {
                Swal.fire("Error", data.error || "Failed to submit feedback.", "error");
            }
        } catch (err) {
            console.error("Error submitting feedback:", err);
            Swal.fire("Error", "Something went wrong while sending feedback.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={submitFeedback}
            className="p-6 bg-white border border-gray-200 rounded-2xl shadow-md space-y-4 max-w-md mx-auto text-left"
        >
            {/* Title */}
            <div>
                <h3 className="text-lg font-bold text-gray-800">Leave Feedback</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Your feedback helps improve the rental experience for both tenants and landlords.
                </p>
            </div>

            {/* Feedback Text */}
            <div>
        <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Write your feedback..."
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={5}
            maxLength={500}
            disabled={loading}
        />
                <div className="text-xs text-gray-400 text-right mt-1">
                    {feedbackText.length}/500 characters
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white font-semibold rounded-xl transition-all duration-300 ${
                    loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md hover:shadow-lg"
                }`}
            >
                {loading ? "Submitting..." : "Submit Feedback"}
            </button>
        </form>
    );
}
