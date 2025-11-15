"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Mail, Shield, Lock, CheckCircle, Zap, Clock } from "lucide-react";

interface TwoFactorToggleProps {
  user_id: string;
  initialIs2FAEnabled?: boolean;
}

const TwoFactorToggle = ({
  user_id,
  initialIs2FAEnabled,
}: TwoFactorToggleProps) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(
    initialIs2FAEnabled || false
  );
  const [loading, setLoading] = useState(true);

  const fetch2FAStatus = async () => {
    try {
      const res = await fetch(`/api/auth/get2faStatus?user_id=${user_id}`);
      const data = await res.json();
      setIs2FAEnabled(data.is2FAEnabled);
    } catch (err) {
      console.error("Error fetching 2FA status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialIs2FAEnabled !== undefined) {
      setIs2FAEnabled(initialIs2FAEnabled);
      setLoading(false);
    } else {
      fetch2FAStatus();
    }
  }, [user_id, initialIs2FAEnabled]);

  const handleToggle2FA = async () => {
    const newStatus = !is2FAEnabled;

    if (newStatus) {
      // Enabling 2FA
      const result = await Swal.fire({
        title: "Enable Email 2FA?",
        html: `
                    <div class="text-left">
                        <p class="mb-3">When enabled, you'll receive verification codes via email during login.</p>
                        <div class="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                            <h4 class="font-semibold text-blue-800 mb-2">📧 Email-Based Authentication</h4>
                            <ul class="text-sm text-blue-700 space-y-1">
                                <li>• Codes sent to your registered email</li>
                                <li>• Each code is valid for a limited time</li>
                                <li>• Provides an extra layer of security</li>
                            </ul>
                        </div>
                    </div>
                `,
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#16a34a",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Enable Email 2FA",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;
    } else {
      // Disabling 2FA
      const result = await Swal.fire({
        title: "Disable 2FA?",
        text: "This will make your account less secure. You won't receive email verification codes during login.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, disable it",
        cancelButtonText: "Keep it enabled",
      });

      if (!result.isConfirmed) return;
    }

    try {
      const res = await fetch("/api/auth/toggle2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, enable_2fa: newStatus }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setIs2FAEnabled(newStatus);

        Swal.fire({
          icon: "success",
          title: newStatus ? "2FA Enabled!" : "2FA Disabled",
          html: newStatus
            ? `
                            <div class="text-center">
                                <p class="mb-3">Email-based two-factor authentication is now active!</p>
                                <div class="bg-green-50 p-3 rounded">
                                    <p class="text-sm text-green-700">
                                        <strong>Next login:</strong> You'll receive a verification code via email
                                    </p>
                                </div>
                            </div>
                        `
            : "Two-factor authentication has been disabled.",
        });

        window.dispatchEvent(new Event("authChange"));
      } else {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: data.message || "Failed to update 2FA setting.",
        });
      }
    } catch (error) {
      console.error("Error updating 2FA:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong. Please try again later.",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-sm text-gray-500">Loading 2FA status...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">
            Email Two-Factor Authentication
          </h3>
          {is2FAEnabled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Active
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Secure your account by receiving verification codes via email during
        login.
      </p>

      {!is2FAEnabled ? (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  📧 Email-Based Verification
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  When you enable 2FA, you'll receive 6-digit verification codes
                  via email during login.
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-sm text-blue-700">
                    <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Extra security for your account</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-blue-700">
                    <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>No app installation required</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-blue-700">
                    <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Codes delivered instantly to your email</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-blue-700">
                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Each code expires after a few minutes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleToggle2FA}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-medium rounded-lg hover:shadow-md transition-shadow"
          >
            <Shield className="w-4 h-4" />
            Enable Email 2FA
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-900 mb-2">
                  ✅ Email 2FA is Active
                </h4>
                <p className="text-sm text-emerald-700">
                  Your account is protected with email-based two-factor
                  authentication. During login, verification codes will be sent
                  to your registered email address.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <p className="text-sm text-amber-700">
                <strong>How it works:</strong> When logging in, check your email
                for the 6-digit verification code and enter it to complete
                authentication.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle2FA}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Disable Email 2FA
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorToggle;
