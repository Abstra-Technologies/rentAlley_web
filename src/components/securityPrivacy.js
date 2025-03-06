"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../hooks/useSession";
import { logEvent } from "../utils/gtag";
import {
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Swal from "sweetalert2";

export default function SecurityPage() {
  const { user, loading, error } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handle2FAToggle = async () => {
    const newStatus = !user.is_2fa_enabled; // Use `user.is_2fa_enabled`
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
    if (formData.newPassword !== formData.confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Passwords do not match!",
        text: "Please make sure the new passwords are identical.",
      });
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.user_id,
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Password Updated!",
          text: "Your password has been changed successfully.",
        });
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

  if (loading) return <p>Loading security settings...</p>;
  if (!user) return <p>User not found. Please log in.</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 py-4 px-6">
        <h2 className="text-2xl font-semibold text-blue-600 mb-6">Menu</h2>
        <nav>
          <ul>
            <li className="py-2 hover:bg-gray-100 rounded-md transition-colors duration-200">
              <a
                href={`/pages/${user.userType}/profile/${user.user_id}`}
                className="flex items-center space-x-2 text-gray-700"
              >
                <UserIcon className="h-5 w-5" />
                <span>Profile</span>
              </a>
            </li>
            <li className="py-2 hover:bg-gray-100 rounded-md transition-colors duration-200">
              <a
                href={`/pages/${user.userType}/securityPrivacy/${user.user_id}`}
                className="flex items-center space-x-2 text-gray-700"
              >
                <ShieldCheckIcon className="h-5 w-5" />
                <span>Security & Privacy</span>
              </a>
            </li>

            {user?.userType === "landlord" && (
              <li className="py-2 hover:bg-gray-100 rounded-md transition-colors duration-200">
                <a
                  href="/pages/landlord/subscription"
                  className="flex items-center space-x-2 text-gray-700"
                >
                  <span>View Subscription</span>
                </a>
              </li>
            )}

            <li className="py-2 hover:bg-gray-100 rounded-md transition-colors duration-200">
              <a href="#" className="flex items-center space-x-2 text-gray-700">
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-semibold text-blue-600 mb-8">
          Security & Privacy
        </h1>
        <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Change Password
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Old Password
              </label>
              <input
                type="password"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Re-type New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              Update Password
            </button>
          </form>
          <div className="mt-6 p-4 border rounded-md">
            <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
            <p className="text-sm text-gray-600">
              Enable or disable 2FA for added security.
            </p>
            <button
              onClick={handle2FAToggle}
              className={`mt-4 px-4 py-2 text-white rounded ${
                user.is_2fa_enabled ? "bg-red-600" : "bg-green-600"
              }`}
            >
              {user.is_2fa_enabled ? "Disable 2FA" : "Enable 2FA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
