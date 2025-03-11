"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../hooks/useSession";
import  Link from "next/link";

import {
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import { logEvent } from "../utils/gtag";
import DeleteAccountButton from "./authentication/deleteAccountButton";
import useAuthStore from "../zustand/authStore";
import SideNavProfile from "./navigation/sidebar-profile";

export default function ProfilePage() {
  const { user, loading, error } = useAuthStore();
  const router = useRouter();

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedFile, setSelectedFile] = useState(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploading, setUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState("");
  const [editing, setEditing] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData(user);
      setProfilePicture(
        user.profilePicture || "https://via.placeholder.com/150"
      );
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && user.userType === "landlord") {
      axios
        .get(`/api/landlord/verification-status?user_id=${user.user_id}`)
        .then((response) => {
          console.log("Verification Status Response:", response.data);
          if (response.data.verification_status) {
            setVerificationStatus(response.data.verification_status);
          } else {
            setVerificationStatus("not verified");
          }
        })
        .catch((err) => {
          console.error("Failed to fetch landlord verification status:", err);
          setVerificationStatus("not verified");
        });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setProfilePicture(URL.createObjectURL(file));

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/profile/profilepic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfilePicture(response.data.imageUrl);
      setProfileData((prev) => ({
        ...prev,
        profilePicture: response.data.imageUrl,
      }));
      console.log("Image uploaded:", response.data.imageUrl);
    } catch (error) {
      console.error("Upload failed:", error);
    }
    setUploading(false);
  };

  const handleUpdateProfile = async () => {
    logEvent("Profile Update", "User Interaction", "User Updated Profile", 1);

    try {
      await axios.post("/api/profile/update", formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      alert("Profile updated successfully!");
      setProfileData((prev) => ({ ...prev, ...formData }));
      setEditing(false);
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Failed to update profile. Try again.");
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-semibold text-blue-600 mb-8">Profile</h1>
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center relative">
              <label className="relative cursor-pointer group">
                <img
                  src={
                    profilePicture ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                  }
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border border-gray-300 shadow-md"
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0
                        group-hover:bg-opacity-50 rounded-full transition-all duration-300"
                >
                  <span
                    className="text-white text-sm font-medium opacity-0 group-hover:opacity-100
                           transition-opacity duration-300"
                  >
                    Change Picture
                  </span>
                </div>
              </label>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">
            Welcome, {user?.firstName}!
          </h2>
          {user.userType === "landlord" && (
            <div className="mt-4">
              {verificationStatus === "1" ? (
                <p className="text-yellow-600 font-bold">
                  ⏳ Verification Pending
                </p>
              ) : verificationStatus === "verified" ? (
                <p className="text-green-600 font-bold">✅ Verified</p>
              ) : verificationStatus === "not verified" ? (
                <div>
                  <p className="text-red-600 font-bold">Not Yet Verified</p>
                  <button
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={() => router.push("/pages/landlord/verification")}
                  >
                    Apply for Verification
                  </button>
                </div>
              ) : verificationStatus === "not verified" ? (
                <div>
                  <p className="text-red-600 font-bold">❌ Not Verified</p>
                  <button
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={() => router.push("/pages/landlord/verification")}
                  >
                    Verify Now
                  </button>
                </div>
              ) : (
                <p className="text-gray-600 font-bold">Unknown Status</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              {editing ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                />
              ) : (
                <input
                  type="text"
                  value={profileData?.firstName}
                  className="text-gray-400 w-full p-2 border rounded-md"
                  readOnly
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              {editing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                />
              ) : (
                <input
                  type="text"
                  value={profileData?.lastName}
                  className="text-gray-400 w-full p-2 border rounded-md"
                  readOnly
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email (Read-Only)
              </label>
              <input
                type="text"
                value={profileData?.email}
                className="text-gray-400 w-full p-2 border rounded-md"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              {editing ? (
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"

                />
              ) : (
                <input
                  type="text"
                  name="phoneNumber"
                  value={profileData?.phoneNumber || "Not provided"}
                  className="text-gray-400 w-full p-2 border rounded-md"
                  readOnly
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                User Type (Read-Only)
              </label>
              <input
                type="text"
                value={user?.userType}
                className="text-gray-400 w-full p-2 border rounded-md"
                readOnly
              />
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <DeleteAccountButton />
            {editing ? (
              <button
                onClick={() => {
                  logEvent(
                    "Profile Update",
                    "User Interaction",
                    "Clicked Save Changes",
                    1
                  );
                  handleUpdateProfile();
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Save Changes
              </button>
            ) : (
              <button
                onClick={() => {
                  logEvent(
                    "Profile Edit",
                    "User Interaction",
                    "Clicked Edit Profile",
                    1
                  );
                  setEditing(true);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
  );
}
