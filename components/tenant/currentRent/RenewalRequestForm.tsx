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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-auto max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-emerald-50 px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Renewal Request
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {unit.property_name} - {unit.unit_name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-emerald-100 border-t-emerald-500 mx-auto mb-3"></div>
                <p className="text-gray-600 font-medium text-sm">
                  Submitting your request...
                </p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Unit Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl p-4 border border-emerald-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Current End Date
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-900 mt-1">
                    {new Date(unit.end_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Current Rent
                  </p>
                  <p className="text-sm sm:text-base font-bold text-emerald-700 mt-1">
                    ₱{unit.rent_amount}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Renewal Start Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setErrors({ ...errors, startDate: "" });
                    }}
                    min={new Date(unit.end_date).toISOString().split("T")[0]}
                    disabled={loading}
                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl text-sm sm:text-base font-medium
                      transition-all duration-200 focus:outline-none
                      ${
                        errors.startDate
                          ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                          : "border-gray-200 bg-gray-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                </div>
                {errors.startDate && (
                  <p className="text-xs text-rose-600 mt-1.5 font-medium">
                    {errors.startDate}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Renewal End Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl text-sm sm:text-base font-medium
                      transition-all duration-200 focus:outline-none
                      ${
                        errors.endDate
                          ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                          : "border-gray-200 bg-gray-50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                </div>
                {errors.endDate && (
                  <p className="text-xs text-rose-600 mt-1.5 font-medium">
                    {errors.endDate}
                  </p>
                )}
              </div>

              {/* Rent Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Proposed Rent Amount{" "}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">
                    ₱
                  </span>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    disabled={loading}
                    placeholder={unit.rent_amount}
                    className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm sm:text-base font-medium
                      bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100
                      transition-all duration-200 focus:outline-none
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Leave blank to keep current amount
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Notes{" "}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={loading}
                    placeholder="Add any special requests or conditions..."
                    rows={4}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-sm sm:text-base font-medium
                      bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100
                      transition-all duration-200 focus:outline-none resize-none
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {notes.length}/500 characters
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 bg-gradient-to-r from-blue-500 via-emerald-500 to-teal-500 text-white rounded-xl font-semibold text-sm sm:text-base hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Send className="w-4 h-4" />
                <span>Submit Request</span>
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold text-sm sm:text-base transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
