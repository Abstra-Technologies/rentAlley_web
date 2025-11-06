"use client";

import { useState } from "react";
import { X, Send, Calendar, FileText } from "lucide-react";
import { Unit } from "@/types/units";

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

export default function RenewalRequestForm({
  unit,
  onSubmit,
  onClose,
  loading,
}: RenewalRequestFormProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!startDate) newErrors.startDate = "Start date is required";
    if (!endDate) newErrors.endDate = "End date is required";
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onSubmit({
      unitId: unit.unit_id,
      agreementId: unit.agreement_id,
      requested_start_date: startDate,
      requested_end_date: endDate,
      requested_rent_amount: rentAmount || null,
      notes: notes || null,
    });
  };

  const isFormValid = startDate && endDate && !loading;

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300">
          {/* Header with gradient */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 via-blue-600 to-emerald-500 px-6 sm:px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Renewal Request
                </h2>
                <p className="text-sm text-white/90 mt-1">
                  {unit.property_name} • Unit {unit.unit_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300 disabled:opacity-50 backdrop-blur-sm"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <div className="relative mx-auto mb-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100"></div>
                  <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-500"></div>
                </div>
                <p className="text-gray-700 font-bold text-lg">
                  Submitting Request
                </p>
                <p className="text-gray-500 text-sm mt-1">Please wait...</p>
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="p-6 sm:p-8 space-y-6">
              {/* Current Unit Info Card */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-2xl p-5 border border-blue-200 shadow-sm">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3">
                  Current Lease Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      End Date
                    </p>
                    <p className="text-base sm:text-lg font-bold text-gray-900">
                      {new Date(unit.end_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Monthly Rent
                    </p>
                    <p className="text-base sm:text-lg font-bold text-emerald-700">
                      ₱{unit.rent_amount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-5">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Renewal Start Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setErrors({ ...errors, startDate: "" });
                      }}
                      min={new Date(unit.end_date).toISOString().split("T")[0]}
                      disabled={loading}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-base font-medium
                        transition-all duration-300 focus:outline-none
                        ${
                          errors.startDate
                            ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                            : "border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50`}
                    />
                  </div>
                  {errors.startDate && (
                    <p className="text-sm text-rose-600 mt-2 font-semibold flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-rose-600 rounded-full"></span>
                      {errors.startDate}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">
                    Must be after current lease end date
                  </p>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Renewal End Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setErrors({ ...errors, endDate: "" });
                      }}
                      min={
                        startDate ||
                        new Date(unit.end_date).toISOString().split("T")[0]
                      }
                      disabled={loading}
                      className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-base font-medium
                        transition-all duration-300 focus:outline-none
                        ${
                          errors.endDate
                            ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                            : "border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50`}
                    />
                  </div>
                  {errors.endDate && (
                    <p className="text-sm text-rose-600 mt-2 font-semibold flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-rose-600 rounded-full"></span>
                      {errors.endDate}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">
                    Select your desired lease end date
                  </p>
                </div>

                {/* Rent Amount */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Proposed Rent Amount{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 font-bold text-lg">
                      ₱
                    </span>
                    <input
                      type="number"
                      value={rentAmount}
                      onChange={(e) => setRentAmount(e.target.value)}
                      disabled={loading}
                      placeholder={unit.rent_amount}
                      className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-300 rounded-xl text-base font-medium
                        bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                        transition-all duration-300 focus:outline-none
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">
                    Leave blank to keep current amount (₱{unit.rent_amount})
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Additional Notes{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-4 pointer-events-none">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={loading}
                      placeholder="Add any special requests, conditions, or additional information..."
                      rows={4}
                      maxLength={500}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl text-base font-medium
                        bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                        transition-all duration-300 focus:outline-none resize-none
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <p className="text-xs text-gray-500 ml-1">
                      Share any details that might help with your request
                    </p>
                    <p className="text-xs text-gray-400 font-semibold">
                      {notes.length}/500
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className="flex-1 flex items-center justify-center gap-2.5 py-4 px-5 bg-gradient-to-r from-blue-500 via-blue-600 to-emerald-500 text-white rounded-xl font-bold text-base hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                  <span>Submit Renewal Request</span>
                </button>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-base transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
