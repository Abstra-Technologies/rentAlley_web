"use client";

import { useState } from "react";
import { Calendar, Save } from "lucide-react";
import axios from "axios";

export default function MoveInModal({ agreement_id, onClose, onSaved, defaultDate }) {
    const [date, setDate] = useState(defaultDate || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!date) return;

        setSaving(true);

        await axios.post("/api/landlord/activeLease/moveIn", {
            agreement_id,
            move_in_date: date,
        });

        setSaving(false);
        onSaved(date);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6">

                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Set Move-In Date
                </h2>

                <p className="text-sm text-gray-600 mt-1 mb-4">
                    Select the official move-in date for the tenant.
                </p>

                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                />

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        disabled={!date || saving}
                        onClick={handleSave}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                    >
                        {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
