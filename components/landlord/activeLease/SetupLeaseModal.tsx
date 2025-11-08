"use client";
import { useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import {
  X,
  FileText,
  Upload,
  Save,
  AlertTriangle,
  Calendar,
  FileQuestion,
} from "lucide-react";

interface LeaseSetupModalProps {
  isOpen: boolean;
  agreement_id: string;
  onClose: () => void;
}

export default function LeaseSetupModal({
  isOpen,
  agreement_id,
  onClose,
}: LeaseSetupModalProps) {
  const router = useRouter();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedOption, setSelectedOption] = useState<
    "upload" | "no_agreement" | null
  >(null);

  if (!isOpen) return null;

  /** ============= 📤 UPLOAD LEASE ============= */
  const handleUploadLease = () => {
    if (!agreement_id) {
      return Swal.fire(
        "No Lease Record",
        "Please create a lease record before uploading.",
        "warning"
      );
    }
    router.push(`/pages/lease/scan/${agreement_id}`);
  };

  /** ============= 💾 SAVE LEASE DATES ============= */
  const handleSaveDates = async () => {
    if (!startDate || !endDate)
      return Swal.fire("Error", "Start and end date are required.", "error");

    if (endDate <= startDate)
      return Swal.fire("Error", "End date must be after start date.", "error");

    const { value: config } = await Swal.fire({
      title: "Configure Security & Advance Payment?",
      html: `
                <div style="text-align:left">
                    <p class="text-gray-600 text-sm mb-3">
                        Optionally configure the security deposit and advance payment.
                        <br/><br/>
                        <em>If left empty, these values will default to ₱0.</em>
                    </p>
                    <input id="swal-deposit" type="number" placeholder="Security Deposit (₱)" class="swal2-input" />
                    <input id="swal-advance" type="number" placeholder="Advance Payment (₱)" class="swal2-input" />
                </div>
            `,
      showCancelButton: true,
      confirmButtonText: "Save & Activate",
      cancelButtonText: "Skip",
      preConfirm: () => {
        const deposit =
          (document.getElementById("swal-deposit") as HTMLInputElement)
            ?.value || "0";
        const advance =
          (document.getElementById("swal-advance") as HTMLInputElement)
            ?.value || "0";
        return { deposit, advance };
      },
    });

    const deposit = config?.deposit || "0";
    const advance = config?.advance || "0";

    Swal.fire({
      title: "Activating Lease...",
      text: "Please wait while we update lease details.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch("/api/leaseAgreement/updateLeaseDateSet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreement_id,
          start_date: startDate,
          end_date: endDate,
          security_deposit_amount: parseFloat(deposit) || 0,
          advance_payment_amount: parseFloat(advance) || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Lease update failed:", data);
        return Swal.fire(
          "Error",
          data.error || "Failed to update lease.",
          "error"
        );
      }

      Swal.fire({
        icon: "success",
        title: "Lease Activated!",
        text: "Lease dates, deposit, and advance payment saved successfully. Tenant has been notified.",
      });

      onClose();
    } catch (error) {
      console.error("Error updating lease:", error);
      Swal.fire(
        "Error",
        "Something went wrong while saving lease details.",
        "error"
      );
    }
  };

  /** ============= 🛑 TERMINATE LEASE ============= */
  const handleTerminateLease = async () => {
    const confirm = await Swal.fire({
      title: "Terminate Lease?",
      text: "This will mark the lease as terminated but retain record.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, terminate",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });
    if (!confirm.isConfirmed) return;

    await fetch("/api/leaseAgreement/terminateLease", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agreement_id }),
    });

    Swal.fire({
      title: "Terminated!",
      text: "Lease has been terminated.",
      icon: "success",
      confirmButtonColor: "#10b981",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 sm:w-6 h-5 sm:h-6 text-white flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Lease Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* STEP 1 — Choose Method */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">
              How would you like to manage this lease agreement?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedOption("upload")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                  selectedOption === "upload"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload Agreement
              </button>
              <button
                onClick={() => setSelectedOption("no_agreement")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                  selectedOption === "no_agreement"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <FileQuestion className="w-4 h-4" />
                No Agreement
              </button>
            </div>
          </div>

          {/* STEP 2 — Date Inputs (only if "no agreement" chosen) */}
          {selectedOption === "no_agreement" && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  Lease Duration
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveDates}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm transition-all"
              >
                <Save className="w-4 h-4" />
                Save & Activate Lease
              </button>
            </div>
          )}

          {/* STEP 3 — Upload flow button */}
          {selectedOption === "upload" && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <button
                onClick={handleUploadLease}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                <Upload className="w-4 h-4" />
                Proceed to Upload Document
              </button>
            </div>
          )}

          {/* STEP 4 — Terminate */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleTerminateLease}
              className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Terminate Lease
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
