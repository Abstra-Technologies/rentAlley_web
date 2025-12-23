"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";
import { BackButton } from "@/components/navigation/backButton";
import {
  Wallet,
  CreditCard,
  Building2,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  Shield,
} from "lucide-react";

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

  // Fetch saved payout details from API
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

    // Build summary for confirmation
    const summaryHtml = `
      <div style="text-align:left; font-size:14px; padding: 16px; background: #f9fafb; border-radius: 8px; margin-top: 16px;">
        <div style="margin-bottom: 12px;">
          <strong style="color: #374151;">Payout Method:</strong> 
          <span style="color: #1f2937;">${method.toUpperCase()}</span>
        </div>
        <div style="margin-bottom: 12px;">
          <strong style="color: #374151;">Account Name:</strong> 
          <span style="color: #1f2937;">${form.account_name}</span>
        </div>
        <div style="margin-bottom: 12px;">
          <strong style="color: #374151;">${
            method === "bank_transfer" ? "Account Number" : "Mobile Number"
          }:</strong> 
          <span style="color: #1f2937;">${form.account_number}</span>
        </div>
        ${
          method === "bank_transfer"
            ? `<div>
                <strong style="color: #374151;">Bank Name:</strong> 
                <span style="color: #1f2937;">${form.bank_name}</span>
              </div>`
            : ""
        }
      </div>
      <div style="margin-top: 16px; padding: 12px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
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

  // Payment method options with icons
  const paymentMethods = [
    {
      value: "gcash",
      label: "GCash",
      icon: Smartphone,
      color: "from-blue-500 to-blue-600",
    },
    {
      value: "maya",
      label: "Maya",
      icon: Smartphone,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      value: "bank_transfer",
      label: "Bank Transfer",
      icon: Building2,
      color: "from-purple-500 to-purple-600",
    },
  ];

  // ============================================
  // SKELETON LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 pt-20 pb-4 md:pt-6 md:pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="max-w-3xl mx-auto">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse mb-4" />
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                    <div className="h-11 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse mt-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pt-20 pb-4 md:pt-6 md:pb-4 px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="max-w-3xl mx-auto">
          <BackButton label="Back" variant="ghost" />

          <div className="mt-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Payout Details
              </h1>
              <p className="text-gray-600 text-sm">
                Configure where you want to receive your rental income
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-24 md:pb-8 md:px-8 lg:px-12 xl:px-16 pt-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Important Information
                </p>
                <p className="text-xs text-blue-700">
                  Make sure your payout details are accurate. All rental
                  payments will be transferred to the account you specify below.
                  Changes may take 24-48 hours to process.
                </p>
              </div>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Account Information
                  </h2>
                  <p className="text-sm text-gray-600">
                    Select your preferred payout method
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Payout Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setMethod(pm.value)}
                      className={`
                        relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                        ${
                          method === pm.value
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }
                      `}
                    >
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${pm.color} rounded-lg flex items-center justify-center shadow-md`}
                      >
                        <pm.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {pm.label}
                      </span>
                      {method === pm.value && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="Juan Dela Cruz"
                />
                <p className="text-xs text-gray-500 mt-1">
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder={
                    method === "bank_transfer" ? "1234567890" : "09XXXXXXXXX"
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  {method === "bank_transfer"
                    ? "Enter your complete bank account number"
                    : "Enter your 11-digit mobile number"}
                </p>
              </div>

              {/* Bank Name (Conditional) */}
              {method === "bank_transfer" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bank_name"
                    value={form.bank_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="BDO, BPI, Metrobank, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your bank's full name
                  </p>
                </div>
              )}

              {/* Security Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">
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
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Save Payout Details
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Change Log Section */}
          {accountData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Change History
                    </h2>
                    <p className="text-sm text-gray-600">
                      Track your payout account updates
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      Date Created
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {new Date(accountData.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      Last Updated
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {new Date(accountData.updated_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      Payout Method
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold border border-blue-200">
                      {accountData.payout_method?.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      Account Name
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {accountData.account_name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      {accountData.payout_method === "bank_transfer"
                        ? "Account Number"
                        : "Mobile Number"}
                    </span>
                    <span className="text-gray-900 font-semibold font-mono">
                      {accountData.account_number}
                    </span>
                  </div>

                  {accountData.payout_method === "bank_transfer" && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600 font-medium">
                        Bank Name
                      </span>
                      <span className="text-gray-900 font-semibold">
                        {accountData.bank_name || "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
