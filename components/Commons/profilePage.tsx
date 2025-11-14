"use client";
import { CITIZENSHIPS } from "@/constant/citizenship";
import occupations from "@/constant/occupations";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  Camera,
  Edit3,
  Save,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  Briefcase,
  Globe,
  Heart,
} from "lucide-react";
import axios from "axios";
import { logEvent } from "@/utils/gtag";
import DeleteAccountButton from "../authentication/deleteAccountButton";
import useAuthStore from "@/zustand/authStore";
import LoadingContent from "../ui/loadingContent";

interface ProfileData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  civil_status: string;
  occupation: string;
  citizenship: string;
  birthDate: string;
  address: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  occupation: string;
  citizenship: string;
  civil_status: string;
  birthDate?: string;
  address: string;
}

type VerificationStatus = "approved" | "pending" | "not verified" | null;

export default function ProfilePage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const user_id = user?.user_id;
  const userType = user?.userType;

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    civil_status: "",
    occupation: "",
    citizenship: "",
    birthDate: "",
    address: "",
  });

  const [profilePicture, setProfilePicture] = useState<string>("");
  const [editing, setEditing] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    occupation: "",
    citizenship: "",
    civil_status: "",
    address: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData(user as ProfileData);
      setProfilePicture(
        user.profilePicture || "https://via.placeholder.com/150"
      );
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        occupation: user.occupation || "",
        citizenship: user.citizenship || "",
        civil_status: user.civil_status || "",
        birthDate: user.birthDate || "",
        address: user.address || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && user?.userType === "landlord") {
      axios
        .get(`/api/landlord/verification-upload/status?user_id=${user.user_id}`)
        .then((response) => {
          if (response.data.verification_status) {
            setVerificationStatus(
              response.data.verification_status as VerificationStatus
            );
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

  useEffect(() => {
    if (user && user?.userType === "landlord" && user.user_id) {
      axios
        .get(`/api/landlord/subscription/${user.user_id}`)
        .then((response) => {
          if (response.data.plan_name) {
            setSubscriptionPlan(response.data.plan_name);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch subscription plan:", err);
        });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProfilePicture(URL.createObjectURL(file));

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const response = await axios.post(
        "/api/profile/uploadProfilePic",
        uploadFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const newImageUrl = response.data.imageUrl;
      setProfilePicture(newImageUrl);
      setProfileData((prev) => ({
        ...prev,
        profilePicture: newImageUrl,
      }));

      useAuthStore.getState().updateUser({
        profilePicture: newImageUrl,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Failed to upload profile picture. Please try again.",
      });
    }
  };

  const handleUpdateProfile = async () => {
    logEvent("Profile Update", "User Interaction", "User Updated Profile", 1);

    try {
      await axios.post("/api/commons/profile/user_profile/update", formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      Swal.fire({
        icon: "success",
        title: "Profile Updated!",
        text: "Your profile has been updated successfully.",
      });

      setProfileData((prev) => ({ ...prev, ...formData }));
      setEditing(false);
    } catch (error) {
      console.error("Profile update failed:", error);

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update profile. Please try again.",
      });
    }
  };

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case "approved":
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </div>
        );
      case "pending":
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Pending
          </div>
        );
      case "not verified":
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            <AlertCircle className="w-3 h-3" />
            Not Verified
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingContent name="profile" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-600">
            Manage your account information
          </p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Subtle Banner */}
          <div className="relative h-20 sm:h-24 bg-gradient-to-r from-blue-600/10 to-emerald-600/10">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30"></div>
          </div>

          {/* Profile Info */}
          <div className="relative px-4 sm:px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
              {/* Profile Picture */}
              <div className="relative group flex-shrink-0">
                <label className="cursor-pointer block">
                  <div className="relative">
                    <img
                      src={
                        profilePicture ||
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                      }
                      alt="Profile"
                      className="w-24 h-24 rounded-xl object-cover border-4 border-white shadow-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-2">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  {user?.userType === "landlord" && getVerificationBadge()}
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {user?.userType}
                  </span>
                  {profileData?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span className="truncate max-w-[200px]">
                        {profileData.email}
                      </span>
                    </span>
                  )}
                  {profileData?.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {profileData.phoneNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Button - Desktop */}
              <div className="hidden sm:block">
                {editing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg hover:shadow-md transition-shadow flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg hover:shadow-md transition-shadow flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Edit Button */}
            <div className="sm:hidden mt-4">
              {editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Verification Alert */}
          {user?.userType === "landlord" &&
            verificationStatus === "not verified" && (
              <div className="mx-4 sm:mx-6 mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Verify Your Account
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Get verified to build trust.
                    </p>
                    <button
                      onClick={() =>
                        router.push("/pages/landlord/verification")
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg hover:shadow-md transition-shadow"
                    >
                      Start Verification
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20 sm:pb-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-3">
            {/* Personal Information - Compact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                  <User className="w-4 h-4 text-blue-600" />
                  Personal Information
                </h3>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* First Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">
                      First Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="px-2 py-1.5 bg-gray-50 rounded text-sm text-gray-900">
                        {profileData?.firstName || "Not provided"}
                      </div>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase">
                      Last Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="px-2 py-1.5 bg-gray-50 rounded text-sm text-gray-900">
                        {profileData?.lastName || "Not provided"}
                      </div>
                    )}
                  </div>

                  {/* Birth Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Birth Date
                    </label>
                    {editing ? (
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate || ""}
                        onChange={handleChange}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="px-2 py-1.5 bg-gray-50 rounded text-sm text-gray-900">
                        {profileData?.birthDate || "Not provided"}
                      </div>
                    )}
                  </div>

                  {/* Civil Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      Civil Status
                    </label>
                    {editing ? (
                      <select
                        name="civil_status"
                        value={formData.civil_status}
                        onChange={handleChange}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="widowed">Widowed</option>
                        <option value="divorced">Divorced</option>
                        <option value="separated">Separated</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className="px-2 py-1.5 bg-gray-50 rounded text-sm text-gray-900 capitalize">
                        {profileData?.civil_status || "Not provided"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Details - Compact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  Professional Details
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {/* Occupation */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">
                    Occupation
                  </label>
                  {editing ? (
                    <select
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      {occupations.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-2 py-1.5 bg-gray-50 rounded text-sm text-gray-900">
                      {occupations.find(
                        (o) => o.value === profileData?.occupation
                      )?.label || "Not provided"}
                    </div>
                  )}
                </div>

                {/* Citizenship */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Citizenship
                  </label>
                  {editing ? (
                    <select
                      name="citizenship"
                      value={formData.citizenship}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      {CITIZENSHIPS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-2 py-1.5 bg-gray-50 rounded text-sm text-gray-900">
                      {CITIZENSHIPS.find(
                        (c) => c.value === profileData?.citizenship
                      )?.label || "Not provided"}
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Address
                  </label>
                  {editing ? (
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  ) : (
                    <div className="px-2 py-1.5 bg-gray-50 rounded text-sm text-gray-900">
                      {profileData?.address || "Not provided"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {/* Contact - Compact */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Contact
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">
                    Email
                  </label>
                  <div className="px-2 py-1.5 bg-gray-50 rounded text-xs text-gray-600 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{profileData?.email}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">Cannot be changed</p>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase">
                    Phone
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="px-2 py-1.5 bg-gray-50 rounded text-sm text-gray-900 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {profileData?.phoneNumber || "Not provided"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Type - Compact */}
            <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg shadow-sm border border-blue-100 overflow-hidden">
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900">
                      {user?.userType === "landlord"
                        ? "Subscription"
                        : "Account Type"}
                    </h3>
                  </div>
                </div>
                <div className="px-2 py-1.5 bg-white rounded shadow-sm">
                  <p className="text-sm font-bold text-gray-900 capitalize">
                    {user?.userType === "landlord" && subscriptionPlan
                      ? subscriptionPlan
                      : user?.userType}
                  </p>
                </div>
                {user?.userType === "landlord" && (
                  <button
                    onClick={() =>
                      router.push("/pages/landlord/subsciption_plan")
                    }
                    className="mt-2 w-full px-2 py-1 text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded transition-colors"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>

            {/* Danger Zone - Compact */}
            <div className="bg-white rounded-lg shadow-sm border border-red-200 overflow-hidden">
              <div className="px-3 py-2 border-b border-red-100 bg-red-50">
                <h3 className="text-sm font-semibold text-red-900 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Danger Zone
                </h3>
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-600 mb-2">
                  Deleting your account is permanent.
                </p>
                <DeleteAccountButton user_id={user_id} userType={userType} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
