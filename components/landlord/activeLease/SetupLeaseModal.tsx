"use client";
import { useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import {
    X,
    FileText,
    Upload,
    Save,
    Power,
    CalendarDays,
    BadgeX,
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
    const [selectedOption, setSelectedOption] = useState<"upload" | "no_agreement" | null>(null);

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
                const deposit = (document.getElementById("swal-deposit") as HTMLInputElement)?.value || "0";
                const advance = (document.getElementById("swal-advance") as HTMLInputElement)?.value || "0";
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
                return Swal.fire("Error", data.error || "Failed to update lease.", "error");
            }

            Swal.fire({
                icon: "success",
                title: "Lease Activated!",
                text: "Lease dates, deposit, and advance payment saved successfully. Tenant has been notified.",
            });

            onClose();
        } catch (error) {
            console.error("Error updating lease:", error);
            Swal.fire("Error", "Something went wrong while saving lease details.", "error");
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
        });
        if (!confirm.isConfirmed) return;

        await fetch("/api/leaseAgreement/terminateLease", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agreement_id }),
        });

        Swal.fire("Terminated!", "Lease has been terminated.", "success");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-0">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-y-auto max-h-[95vh]">
                {/* ❌ Close */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition"
                >
                    <BadgeX className="w-5 h-5" />
                </button>

                {/* 🏠 Header */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-600" />
                    Lease Setup
                </h2>

                {/* STEP 1 — Choose Method */}
                <div className="mb-6">
                    <p className="text-sm text-gray-700 mb-3 font-medium">
                        How would you like to manage this lease agreement?
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => setSelectedOption("upload")}
                            className={`flex-1 py-3 rounded-lg border font-semibold text-sm transition ${
                                selectedOption === "upload"
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "border-gray-300 hover:bg-gray-50 text-gray-700"
                            }`}
                        >
                            <Upload className="inline w-4 h-4 mr-2" />
                            Upload Lease Agreement
                        </button>
                        <button
                            onClick={() => setSelectedOption("no_agreement")}
                            className={`flex-1 py-3 rounded-lg border font-semibold text-sm transition ${
                                selectedOption === "no_agreement"
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "border-gray-300 hover:bg-gray-50 text-gray-700"
                            }`}
                        >
                            <FileQuestion className="inline w-4 h-4 mr-2" />
                            No Lease Agreement
                        </button>
                    </div>
                </div>

                {/* STEP 2 — Date Inputs (only if "no agreement" chosen) */}
                {selectedOption === "no_agreement" && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1">
                            <CalendarDays className="w-4 h-4 text-emerald-600" />
                            Lease Duration
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 bg-gray-50"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveDates}
                            className="mt-5 w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white py-3 rounded-lg font-semibold text-sm shadow-sm"
                        >
                            <Save className="inline w-4 h-4 mr-2" />
                            Save & Activate Lease
                        </button>
                    </div>
                )}

                {/* STEP 3 — Upload flow button */}
                {selectedOption === "upload" && (
                    <div className="mb-6">
                        <button
                            onClick={handleUploadLease}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold text-sm"
                        >
                            <Upload className="inline w-4 h-4 mr-2" />
                            Proceed to Upload Lease Document
                        </button>
                    </div>
                )}

                {/* STEP 4 — Terminate */}
                <div className="border-t border-gray-200 pt-5 mt-5">
                    <button
                        onClick={handleTerminateLease}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold text-sm"
                    >
                        <Power className="inline w-4 h-4 mr-1" />
                        Terminate Lease
                    </button>
                </div>
            </div>
        </div>
    );
}
