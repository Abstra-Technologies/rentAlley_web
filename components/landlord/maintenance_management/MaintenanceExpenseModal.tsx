"use client";

import axios from "axios";
import React, { useState } from "react";
import Swal from "sweetalert2";
import { X } from "lucide-react";

export default function MaintenanceExpenseModal({
    requestId,
    onClose,
    onSaved,
    userId,
}) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("materials");
    const [loading, setLoading] = useState(false);

    const expenseCategories = [
        { value: "materials", label: "Materials" },
        { value: "labor", label: "Labor" },
        { value: "service", label: "Service" },
        { value: "other", label: "Other" },
    ];

    const handleSave = async () => {
        if (!amount || Number(amount) <= 0) {
            Swal.fire("Missing Amount", "Please input a valid expense amount.", "warning");
            return;
        }

        setLoading(true);

        try {
            await axios.post("/api/maintenance/updateStatus/addExpense", {
                amount,
                description,
                category,

                reference_type: "maintenance",
                reference_id: requestId,

                created_by: userId,

                new_status: "completed",
                completion_date: new Date().toISOString(),
            });

            Swal.fire({
                icon: "success",
                title: "Saved!",
                text: "Maintenance expense recorded.",
                timer: 1200,
                showConfirmButton: false,
            });

            // Return data to parent
            onSaved({
                amount,
                description,
                category,
            });
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to save expense.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6 animate-scaleIn relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-5">Record Maintenance Expense</h2>

                {/* Amount */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Expense Amount (₱)</label>
                    <input
                        type="number"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mt-1 focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                    />
                </div>

                {/* Category */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Expense Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mt-1 focus:ring-2 focus:ring-blue-500"
                    >
                        {expenseCategories.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Description */}
                <div className="mb-4">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg mt-1 focus:ring-2 focus:ring-blue-500"
                        placeholder="Add optional notes about this expense..."
                        rows={3}
                    />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`px-5 py-2 rounded-lg text-white font-medium transition ${
                            loading
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {loading ? "Saving..." : "Save Expense"}
                    </button>
                </div>
            </div>
        </div>
    );
}
