
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../hooks/useSession";
import axios from "axios";

export default function ProfilePage() {
    const { user, loading, error } = useAuth();
    const router = useRouter();

    const [profileData, setProfileData] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [profilePicture, setProfilePicture] = useState("");
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
    });

    useEffect(() => {
        if (user) {
            console.log("🔍 [DEBUG] User Data from useSession:", user);
            setProfileData(user);
            setProfilePicture(user.profilePicture || "https://via.placeholder.com/150");
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phoneNumber: user.phoneNumber || "",
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    //file change for profile pic
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setProfilePicture(URL.createObjectURL(file)); // Show preview of the pic
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await axios.post("/api/profile/profilepic", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setProfilePicture(response.data.imageUrl);
            console.log("✅ Image uploaded:", response.data.imageUrl);
        } catch (error) {
            console.error("❌ Upload failed:", error);
        }

        setUploading(false);
    };

    const handleUpdateProfile = async () => {
        try {
            const response = await axios.post("/api/profile/update", formData, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            });

            alert("Profile updated successfully!");
            setProfileData((prev) => ({ ...prev, ...formData })); // Update state
            setEditing(false);
        } catch (error) {
            console.error("Profile update failed:", error);
            alert("Failed to update profile. Try again.");
        }
    };

    if (loading) return <p>Loading profile...</p>;
    if (!user) return <p>User not found. Please log in.</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Profile Information</h1>

            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center">
                <img
                    src={profilePicture || "https://via.placeholder.com/150"}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border"
                />
                <input type="file" accept="image/*" onChange={handleFileChange} className="mt-3"/>
                <button
                    onClick={handleUpload}
                    className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    disabled={uploading}
                >
                    {uploading ? "Uploading..." : "Upload Profile Picture"}
                </button>
            </div>

            <div className="mt-6 space-y-3">
                <div>
                    <p className="font-semibold">First Name</p>
                    {editing ? (
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                        />
                    ) : (
                        <p>{profileData?.firstName}</p>
                    )}
                </div>

                <div>
                    <p className="font-semibold">Last Name</p>
                    {editing ? (
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                        />
                    ) : (
                        <p>{profileData?.lastName}</p>
                    )}
                </div>

                <div>
                    <p className="font-semibold">Email (Read-Only)</p>
                    <p className="text-gray-600">{profileData?.email}</p>
                </div>

                <div>
                    <p className="font-semibold">Phone Number</p>
                    {editing ? (
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                        />
                    ) : (
                        <p>{profileData?.phoneNumber || "Not provided"}</p>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center mt-4 space-x-4">
                {editing ? (
                    <>
                        <button
                            onClick={handleUpdateProfile}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </>
                ) : (
                    <button
                        onClick={() => setEditing(true)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            <button
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                onClick={() => router.push("/dashboard")}
            >
                Back to Dashboard
            </button>
        </div>
    );
}
