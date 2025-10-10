"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { formatDate, formatCurrency } from "@/utils/formatter/formatters";
import { Unit } from "@/types/units";
import LoadingScreen from "@/components/loadingScreen";

interface RenewalRequestFormProps {
    unit: Unit;
    onSubmit: (renewalData: {
        unitId: string;
        agreementId: string;
        requested_start_date: string;
        requested_end_date: string;
        requested_rent_amount: string | null;
        notes: string | null;
    }) => void;
    onClose: () => void;
    loading: boolean;
}

export default function RenewalRequestForm({ unit, onSubmit, onClose, loading }: RenewalRequestFormProps) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [rentAmount, setRentAmount] = useState("");
    const [notes, setNotes] = useState("");

    const handleSubmit = () => {
        onSubmit({
            unitId: unit.unit_id,
            agreementId: unit.agreement_id,
            requested_start_date: startDate,
            requested_end_date: endDate,
            requested_rent_amount: rentAmount || null,
            notes: notes || null,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
                    <LoadingScreen message="Submitting renewal request..." />
                </div>
            )}
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Request Lease Renewal</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            min={formatDate(new Date(unit.end_date))}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            rows={3}
                        />
                    </div>
                </div>
                <div className="mt-6 flex gap-2">
                    <button
                        onClick={handleSubmit}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || !startDate || !endDate}
                    >
                        <Send className="w-4 h-4" />
                        Submit Request
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}