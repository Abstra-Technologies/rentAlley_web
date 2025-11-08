import React, { useState } from "react";
import Swal from "sweetalert2";
import { Sparkles, Loader2 } from "lucide-react";

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">AI Unit Generator</h3>
          <p className="text-sm text-gray-600">
            Let AI create multiple units for you
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Example:</strong> "Generate 10 units from 101 to 110, ₱5000
          rent each"
        </p>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe what you want
        </label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          rows={4}
          placeholder="Enter your AI prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading}
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
            <span>Generate with AI</span>
          </>
        )}
      </button>
    </div>
  );
}
