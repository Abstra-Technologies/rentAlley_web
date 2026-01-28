"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";
import { BackButton } from "@/components/navigation/backButton";
import {
  Wallet,
  CreditCard,
  Building2,
  Smartphone,
  CheckCircle,
  Info,
  Clock,
  Shield,
} from "lucide-react";

// ============================================
// ANIMATION VARIANTS
// ============================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function PayoutDetails() {
  const { user, fetchSession } = useAuthStore();
  const landlord_id = user?.landlord_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [method, setMethod] = useState("gcash");
  const [form, setForm] = useState({
    account_name: "",
    account_number: "",
    bank_name: "",
  });

  const [accountData, setAccountData] = useState(null);

  // ============================================
  // FETCH PAYOUT ACCOUNT
  // ============================================
  const fetchPayoutAccount = async () => {
    try {
      const res = await axios.get("/api/landlord/payout/getAccount", {
        params: { landlord_id },
      });

      if (res.data?.account) {
        const acc = res.data.account;
        setAccountData(acc);

        setMethod(acc.payout_method);
        setForm({
          account_name: acc.account_name,
          account_number: acc.account_number,
          bank_name: acc.bank_name || "",
        });
      }
    } catch (err) {
      console.warn("No existing payout record found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) fetchSession();
    if (user?.landlord_id) fetchPayoutAccount();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ============================================
  // HANDLE SAVE
  // ============================================
  const handleSave = async () => {
    if (!form.account_name || !form.account_number) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please complete all required fields.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (method === "bank_transfer" && !form.bank_name) {
      Swal.fire({
        icon: "warning",
        title: "Missing Bank Name",
        text: "Please provide your bank name.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const summaryHtml = `
      <div style="text-align:left; font-size:14px; padding: 16px; background: #f9fafb; border-radius: 12px; margin-top: 16px;">
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between;">
          <strong style="color: #6b7280;">Payout Method</strong> 
          <span style="color: #1f2937; font-weight: 600;">${method.toUpperCase()}</span>
        </div>
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between;">
          <strong style="color: #6b7280;">Account Name</strong> 
          <span style="color: #1f2937; font-weight: 600;">${form.account_name}</span>
        </div>
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between;">
          <strong style="color: #6b7280;">${method === "bank_transfer" ? "Account Number" : "Mobile Number"}</strong> 
          <span style="color: #1f2937; font-weight: 600;">${form.account_number}</span>
        </div>
        ${
          method === "bank_transfer"
            ? `<div style="display: flex; justify-content: space-between;">
                <strong style="color: #6b7280;">Bank Name</strong> 
                <span style="color: #1f2937; font-weight: 600;">${form.bank_name}</span>
              </div>`
            : ""
        }
      </div>
      <div style="margin-top: 16px; padding: 12px; background: #fef2f2; border-radius: 12px; border-left: 4px solid #dc2626;">
        <p style="color: #b91c1c; font-size: 13px; margin: 0;">
          ⚠️ <strong>Important:</strong> Incorrect details may cause payout delays or failures.
        </p>
      </div>
    `;

    const confirm = await Swal.fire({
      title: "Confirm Your Payout Details",
      html: `
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
          Please review your information carefully before saving.
        </p>
        ${summaryHtml}
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Save Details",
      cancelButtonText: "Review Again",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);

    try {
      await axios.post("/api/landlord/payout/saveAccount", {
        landlord_id,
        payout_method: method,
        account_name: form.account_name,
        account_number: form.account_number,
        bank_name: method === "bank_transfer" ? form.bank_name : null,
      });

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Your payout details have been updated.",
        confirmButtonColor: "#2563eb",
      });

      fetchPayoutAccount();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save payout details. Please try again.",
        confirmButtonColor: "#dc2626",
      });
    }

    setSaving(false);
  };

  // ============================================
  // PAYMENT METHODS CONFIG
  // ============================================
  const paymentMethods = [
    {
      value: "gcash",
      label: "GCash",
      icon: Smartphone,
      gradient: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50",
      borderActive: "border-blue-500",
      iconBg: "from-blue-100 to-blue-200",
      iconColor: "text-blue-600",
    },
    {
      value: "maya",
      label: "Maya",
      icon: Smartphone,
      gradient: "from-emerald-500 to-emerald-600",
      lightBg: "bg-emerald-50",
      borderActive: "border-emerald-500",
      iconBg: "from-emerald-100 to-emerald-200",
      iconColor: "text-emerald-600",
    },
    {
      value: "bank_transfer",
      label: "Bank Transfer",
      icon: Building2,
      gradient: "from-purple-500 to-purple-600",
      lightBg: "bg-purple-50",
      borderActive: "border-purple-500",
      iconBg: "from-purple-100 to-purple-200",
      iconColor: "text-purple-600",
    },
  ];

  const selectedMethod = paymentMethods.find((pm) => pm.value === method);

  // ============================================
  // LOADING SKELETON
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4 lg:py-6">
          <div className="h-8 bg-gray-200 rounded-lg w-20 animate-pulse mb-4" />
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gray-200 rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-6 lg:h-7 bg-gray-200 rounded-lg w-40 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded-lg w-64 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="px-4 md:px-6 lg:px-8 py-6">
          {/* Info Alert Skeleton */}
          <div className="bg-gray-100 rounded-2xl p-4 lg:p-5 mb-6 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-56 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="p-4 lg:p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 bg-gray-200 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
                {[1, 2].map((i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-28 animate-pulse mb-2" />
                    <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
                  </div>
                ))}
                <div className="h-12 bg-gray-200 rounded-xl animate-pulse mt-4" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-xl animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="p-4 lg:p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between py-2">
                    <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4 lg:py-6"
      >
        <BackButton label="Back" variant="ghost" />

        <div className="mt-4 flex items-center gap-3 lg:gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25"
          >
            <Wallet className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              Payout Details
            </h1>
            <p className="text-sm text-gray-500">
              Configure where you receive your rental income
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 md:px-6 lg:px-8 py-6 pb-24 lg:pb-8"
      >
        {/* Info Alert - Full Width */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-2xl p-4 lg:p-5 mb-6"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Important Information
              </p>
              <p className="text-xs lg:text-sm text-blue-700">
                Make sure your payout details are accurate. All rental payments
                will be transferred to the account you specify below. Changes
                may take 24-48 hours to process.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Grid - 2 columns on xl */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Main Form Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Card Header */}
            <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-gray-900">
                    Account Information
                  </h2>
                  <p className="text-xs lg:text-sm text-gray-500">
                    Select your preferred payout method
                  </p>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 lg:p-6 space-y-5">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Payout Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 lg:gap-3">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setMethod(pm.value)}
                      className={`
                        relative flex flex-col items-center gap-2 p-3 lg:p-4 rounded-xl border-2 transition-all duration-200
                        ${
                          method === pm.value
                            ? `${pm.borderActive} ${pm.lightBg}`
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }
                      `}
                    >
                      <div
                        className={`w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${pm.iconBg} rounded-xl flex items-center justify-center`}
                      >
                        <pm.icon
                          className={`w-5 h-5 lg:w-6 lg:h-6 ${pm.iconColor}`}
                        />
                      </div>
                      <span className="text-xs lg:text-sm font-medium text-gray-900">
                        {pm.label}
                      </span>
                      {method === pm.value && (
                        <div className="absolute -top-1.5 -right-1.5">
                          <div
                            className={`w-5 h-5 lg:w-6 lg:h-6 bg-gradient-to-br ${pm.gradient} rounded-full flex items-center justify-center shadow-sm`}
                          >
                            <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="account_name"
                  value={form.account_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 lg:py-3.5 border-2 border-gray-200 rounded-xl text-sm lg:text-base bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Juan Dela Cruz"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Enter the full name registered to your account
                </p>
              </div>

              {/* Account Number / Mobile */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {method === "bank_transfer"
                    ? "Account Number"
                    : "Mobile Number"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="account_number"
                  value={form.account_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 lg:py-3.5 border-2 border-gray-200 rounded-xl text-sm lg:text-base bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder={
                    method === "bank_transfer" ? "1234567890" : "09XXXXXXXXX"
                  }
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  {method === "bank_transfer"
                    ? "Enter your complete bank account number"
                    : "Enter your 11-digit mobile number"}
                </p>
              </div>

              {/* Bank Name (Conditional) */}
              <AnimatePresence>
                {method === "bank_transfer" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={form.bank_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 lg:py-3.5 border-2 border-gray-200 rounded-xl text-sm lg:text-base bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      placeholder="BDO, BPI, Metrobank, etc."
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Enter your bank's full name
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Security Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Security Notice
                    </p>
                    <p className="text-xs text-amber-700">
                      Your payout information is encrypted and securely stored.
                      We will never share your financial details with third
                      parties without your consent.
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Save Payout Details</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Right Column - Account Summary */}
          <div className="space-y-4 lg:space-y-6">
            {/* Account Summary Card */}
            {accountData ? (
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Card Header */}
                <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-base lg:text-lg font-bold text-gray-900">
                        Account Summary
                      </h2>
                      <p className="text-xs lg:text-sm text-gray-500">
                        Your current payout configuration
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 lg:p-6">
                  <div className="space-y-0 divide-y divide-gray-100">
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-gray-500">
                        Date Created
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(accountData.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-gray-500">
                        Last Updated
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(accountData.updated_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-gray-500">
                        Payout Method
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${selectedMethod?.lightBg} ${selectedMethod?.iconColor}`}
                      >
                        {accountData.payout_method?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-gray-500">
                        Account Name
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {accountData.account_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm text-gray-500">
                        {accountData.payout_method === "bank_transfer"
                          ? "Account Number"
                          : "Mobile Number"}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 font-mono">
                        {accountData.account_number}
                      </span>
                    </div>
                    {accountData.payout_method === "bank_transfer" && (
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-gray-500">Bank Name</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {accountData.bank_name || "N/A"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-6 lg:p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No Payout Account
                  </h3>
                  <p className="text-sm text-gray-500">
                    Fill in the form to set up your payout account and start
                    receiving payments.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Quick Tips Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center">
                    <Info className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-600" />
                  </div>
                  <div>
                    <h2 className="text-base lg:text-lg font-bold text-gray-900">
                      Quick Tips
                    </h2>
                    <p className="text-xs lg:text-sm text-gray-500">
                      Important reminders for payouts
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 lg:p-6">
                <ul className="space-y-3">
                  {[
                    {
                      color: "bg-blue-500",
                      text: "Double-check your account details before saving",
                    },
                    {
                      color: "bg-emerald-500",
                      text: "Payouts are processed within 24-48 hours",
                    },
                    {
                      color: "bg-purple-500",
                      text: "Contact support if you experience any issues",
                    },
                  ].map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span
                        className={`w-2 h-2 ${tip.color} rounded-full mt-1.5 flex-shrink-0`}
                      />
                      <span className="text-sm text-gray-600">{tip.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
