import React, { useState } from "react";
import Swal from "sweetalert2";
import { Sparkles, Loader2,Lightbulb  } from "lucide-react";

export default function AIUnitGenerator({
  propertyId,
}: {
  propertyId: number | string;
}) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Swal.fire({
        title: "Missing Input",
        text: "Please enter a prompt first.",
        icon: "warning",
        confirmButtonColor: "#3b82f6",
      });
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
          confirmButtonColor: "#10b981",
        }).then(() => {
          window.location.reload();
        });
      } else {
        Swal.fire({
          title: "No Output",
          text: "AI did not return any structured units.",
          icon: "info",
          confirmButtonColor: "#3b82f6",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: "Error",
        text: "Failed to generate units with AI.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsLoading(false);
    }
  };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">AI Unit Generator</h3>
                    <p className="text-sm text-gray-600">
                        Describe your units in plain language — AI will handle the rest.
                    </p>
                </div>
            </div>

            {/* Info box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
                <p className="text-sm text-emerald-800 font-medium flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-emerald-600" />
                    <span>How to write a good prompt:</span>
                </p>
                <ul className="list-disc list-inside text-sm text-emerald-800 ml-1 space-y-1">
                    <li>🧱 Specify <strong>how many units</strong> you want.</li>
                    <li>🏷️ Include <strong>rent amount</strong> and <strong>style</strong> (studio, 1-bedroom, etc.).</li>
                    <li>📍 Optionally describe <strong>amenities</strong> or features (WiFi, Aircon, Balcony).</li>
                    <li>✨ Keep it simple — the AI understands natural language.</li>
                </ul>

                <div className="mt-3 p-3 bg-white rounded-md border border-dashed border-emerald-300 text-sm text-gray-700">
                    <p className="font-medium text-emerald-700 mb-1">Examples:</p>
                    <ul className="space-y-1">
                        <li>
                            • <em>“Generate 10 studio units from 101 to 110, ₱5,000 rent each.”</em>
                        </li>
                        <li>
                            • <em>“Create 3 units: one studio ₱8,000, one 1-bedroom ₱12,000, and one 2-bedroom ₱18,000 — all furnished with WiFi.”</em>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Textarea */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ✍️ Describe your units
                </label>
                <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    rows={5}
                    placeholder='Example: "Generate 5 studio units with ₱6000 rent each, furnished with WiFi and Aircon."'
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating...</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate Units with AI</span>
                    </>
                )}
            </button>
        </div>
    );

}
