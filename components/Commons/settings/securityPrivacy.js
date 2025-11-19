"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logEvent } from "../../../utils/gtag";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";
import ChangePasswordModal from "../setttings/changePassword";
import TwoFactorToggle from "../setttings/TwoFactorToggle";
import { Shield, Lock, ShieldCheck } from "lucide-react";

export default function SecurityPage() {
  const { user, loading, error } = useAuthStore();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative w-10 h-10 mx-auto mb-3">
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">
            Loading security settings...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 font-medium">
            User not found. Please log in.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm text-red-600 font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Security & Privacy
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Manage your account security settings
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="space-y-4 sm:space-y-6 mb-20 sm:mb-6">
        {/* Password Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
          {/* Status Bar */}
          <div className="h-1 sm:h-1.5 bg-gradient-to-r from-blue-500 to-emerald-500" />

          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-emerald-50">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">
                  Password
                </h2>
                <p className="text-xs text-gray-600">
                  Update your password regularly
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <ChangePasswordModal userId={user?.user_id} />
          </div>
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
          {/* Status Bar */}
          <div className="h-1 sm:h-1.5 bg-gradient-to-r from-emerald-500 to-blue-500" />

          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-br from-emerald-50 to-blue-50">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">
                  Two-Factor Authentication
                </h2>
                <p className="text-xs text-gray-600">
                  Add an extra layer of security
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <TwoFactorToggle user_id={user?.user_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
