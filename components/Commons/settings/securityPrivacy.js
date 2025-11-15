"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../../hooks/useSession";
import { logEvent } from "../../../utils/gtag";
import {
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import SideNavProfile from "../../navigation/sidebar-profile";
import useAuthStore from "@/zustand/authStore";
import ChangePasswordModal from "../setttings/changePassword";
import TwoFactorToggle from "../setttings/TwoFactorToggle";
import { Shield, Lock } from "lucide-react";

export default function SecurityPage() {
  const { user, loading, error } = useAuthStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handle2FAToggle = async () => {
    const newStatus = !user.is_2fa_enabled;
    logEvent("2FA Enable", "User Interaction", "User Updated 2FA", 1);

    try {
      const res = await fetch("/api/auth/toggle-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          enable_2fa: newStatus,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: data.message,
        });

        setFormData((prev) => ({
          ...prev,
          is_2fa_enabled: newStatus,
        }));

        window.dispatchEvent(new Event("authChange"));
      } else {
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to update 2FA setting.",
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword.length < 8) {
      await Swal.fire({
        icon: "warning",
        title: "Password too short!",
        text: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      await Swal.fire({
        icon: "warning",
        title: "Passwords do not match!",
        text: "Please make sure the new passwords are identical.",
      });
      return;
    }

    try {
      const res = await fetch("/api/profile/changePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
        credentials: "include",
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Password Updated!",
          text: "Your password has been changed successfully.",
        });

        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const data = await res.json();
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: data.message || "Error updating password.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong. Please try again later.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-3"></div>
          <p className="text-sm text-gray-600">Loading security settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">User not found. Please log in.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Security & Privacy
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your account security settings
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6 pb-6">
          {/* Password Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  Password
                </h2>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <ChangePasswordModal userId={user?.user_id} />
            </div>
          </div>

          {/* Two-Factor Authentication Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-semibold text-gray-900">
                  Two-Factor Authentication
                </h2>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <TwoFactorToggle user_id={user?.user_id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
