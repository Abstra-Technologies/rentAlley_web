"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { Star } from "lucide-react";

interface FeedbackFormProps {
    agreement_id: string | number;
    onFeedbackSubmitted: () => void;
}

export default function FeedbackForm({
                                         agreement_id,
                                         onFeedbackSubmitted,
                                     }: FeedbackFormProps) {
    const [feedbackText, setFeedbackText] = useState("");
    const [loading, setLoading] = useState(false);

    // ⭐ Rating categories
    const [ratings, setRatings] = useState({
        communication: 0,
        maintenance: 0,
        condition: 0,
        safety: 0,
        value: 0,
        professionalism: 0,
        support: 0,
    });

    const handleStarClick = (key: keyof typeof ratings, value: number) => {
        setRatings((prev) => ({ ...prev, [key]: value }));
    };

    const submitFeedback = async (e: React.FormEvent) => {
        e.preventDefault();

        if (Object.values(ratings).some((r) => r === 0)) {
            Swal.fire("Error", "Please rate all categories before submitting.", "error");
            return;
        }
        if (!feedbackText.trim()) {
            Swal.fire("Error", "Please add some comments before submitting.", "error");
            return;
        }

        try {
            setLoading(true);

            const avgRating =
                Object.values(ratings).reduce((a, b) => a + b, 0) /
                Object.keys(ratings).length;

            const res = await fetch("/api/tenant/activeRent/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agreement_id,
                    feedback_text: feedbackText.trim(),
                    ratings,
                    avg_rating: avgRating,
                }),
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch {
                /* ignore JSON parse errors for empty bodies */
            }

            if (res.status === 201 || res.ok) {
                Swal.fire({
                    icon: "success",
                    title: "Feedback Submitted!",
                    text: data.message || "Thank you for sharing your experience.",
                    confirmButtonColor: "#10B981",
                });
                setFeedbackText("");
                setRatings({
                    communication: 0,
                    maintenance: 0,
                    condition: 0,
                    safety: 0,
                    value: 0,
                    professionalism: 0,
                    support: 0,
                });
                onFeedbackSubmitted();
            } else {
                Swal.fire("Error", data.error || "Failed to submit feedback.", "error");
            }
        } catch (err: any) {
            console.error("❌ Error submitting feedback:", err);
            Swal.fire("Error", err.message || "Something went wrong.", "error");
        } finally {
            setLoading(false);
        }
    };

    const ratingLabels: Record<keyof typeof ratings, string> = {
        communication: "Communication",
        maintenance: "Maintenance Response",
        condition: "Property Condition",
        safety: "Safety & Security",
        value: "Value for Money",
        professionalism: "Professionalism",
        support: "Support Availability",
    };

    return (
        <form
            onSubmit={submitFeedback}
            className="p-6 sm:p-8 bg-white border border-gray-200 rounded-2xl shadow-md space-y-6 max-w-lg mx-auto"
        >
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800">Rate Your Experience</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Your honest feedback helps improve the landlord and property experience.
                </p>
            </div>

            {/* Rating Categories */}
            <div className="space-y-5">
                {Object.keys(ratings).map((key) => (
                    <div key={key}>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                            {ratingLabels[key as keyof typeof ratings]}
                        </p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                        handleStarClick(key as keyof typeof ratings, star)
                                    }
                                    className="focus:outline-none"
                                >
                                    <Star
                                        className={`w-6 h-6 transition ${
                                            star <= ratings[key as keyof typeof ratings]
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300 hover:text-yellow-300"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Feedback Text */}
            <div>
                <label
                    htmlFor="feedback"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    Comments
                </label>
                <textarea
                    id="feedback"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Share more about your experience..."
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
