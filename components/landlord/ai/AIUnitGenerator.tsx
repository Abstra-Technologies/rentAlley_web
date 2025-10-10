import React, { useState } from "react";
import Swal from "sweetalert2";

export default function AIUnitGenerator({ propertyId }: { propertyId: number }) {
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            Swal.fire("Missing Input", "Please enter a prompt first.", "warning");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/ai/landlord/unitGenerator", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, property_id: propertyId }),
            });
            const data = await res.json();

            if (data.units?.length) {
                Swal.fire({
                    title: "AI Units Generated",
                    text: `${data.units.length} units created successfully.`,
                    icon: "success",
                });
            } else {
                Swal.fire("No Output", "AI did not return any structured units.", "info");
            }
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to generate units with AI.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded-xl shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                AI Unit Generator
            </h3>
            <p className="text-sm text-gray-600 mb-3">
                Describe what you want (e.g. “Generate 10 units from 101 to 110, ₱5000 rent each”)
            </p>
            <textarea
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                rows={3}
                placeholder="Enter your AI prompt..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium shadow hover:shadow-lg transition-all duration-200"
            >
                {isLoading ? "Generating..." : "✨ Generate with AI"}
            </button>
        </div>
    );
}
