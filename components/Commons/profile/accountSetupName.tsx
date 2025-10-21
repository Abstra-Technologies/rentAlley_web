"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import {
  UserIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function NameModal({
  isOpen,
  onClose,
  userId,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !dob.trim()) {
      setError("All fields are required.");
      return;
    }

    if (firstName.trim().length < 2) {
      setError("First name must be at least 2 characters.");
      return;
    }

    if (lastName.trim().length < 2) {
      setError("Last name must be at least 2 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/user/updateProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, firstName, lastName, dob }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
        <Dialog.Panel className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-emerald-500 px-6 sm:px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <Dialog.Title className="text-2xl sm:text-3xl font-bold text-white">
                Welcome!
              </Dialog.Title>
            </div>
            <p className="text-blue-50 text-sm mt-2">
              Let's complete your profile to get started
            </p>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-5">
            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-emerald-700">
                  Profile updated successfully!
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-xl border border-red-200">
                <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-red-700">
                  {error}
                </span>
              </div>
            )}

            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g., Juan"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g., Dela Cruz"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value);
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-200 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                loading || !firstName.trim() || !lastName.trim() || !dob.trim()
              }
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Saving..." : "Complete Setup"}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
