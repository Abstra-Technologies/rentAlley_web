"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../hooks/useSession";
import axios from "axios"; // Import authentication hook

export default function ProfilePage() {
    const { user, loading, error } = useAuth();
    const router = useRouter();
    const [profileData, setProfileData] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [profilePicture, setProfilePicture] = useState("");


    useEffect(() => {
        if (user) {
            console.log("🔍 [DEBUG] User Data from useSession:", user); // Log fetched user data
            setProfileData(user);
            setProfilePicture(user.profilePicture || "https://via.placeholder.com/150");
        }
    }, [user]);


    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
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
    //
    // const handleUpload = async () => {
    //     if (!selectedFile) {
    //         alert("Please select a file.");
    //         return;
    //     }
    //
    //     setUploading(true);
    //     const formData = new FormData();
    //     formData.append("file", selectedFile);
    //
    //     try {
    //         const response = await axios.post("/api/profile/profilepic", formData, {
    //             headers: { "Content-Type": "multipart/form-data" },
    //             withCredentials: true,
    //         });
    //
    //         alert("Profile picture updated!");
    //         setProfileData((prev) => ({ ...prev, profilePicture: response.data.imageUrl }));
    //     } catch (error) {
    //         console.error("Upload failed:", error);
    //         alert("Failed to upload. Try again.");
    //     }
    //     setUploading(false);
    // };

    if (loading) return <p>Loading profile...</p>;
    if (!user) return <p>User not found. Please log in.</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Profile Information</h1>


            <div className="flex flex-col items-center">
                <img src={profilePicture || "https://via.placeholder.com/150"} alt="Profile" className="w-32 h-32 rounded-full object-cover" />
                <input type="file" accept="image/*" onChange={handleFileChange} className="mt-3"/>
                <button
                    onClick={handleUpload}
                    className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    disabled={uploading}
                >
                    {uploading ? "Uploading..." : "Upload Profile Picture"}
                </button>
            </div>


            {profileData ? (
                <div className="space-y-3">
                    <p>Profile ID: {profileData.profilePicture}</p>
                    <p><strong>Name:</strong> {profileData.firstName} {profileData.lastName}</p>
                    <p><strong>Email:</strong> {profileData.email}</p>
                    <p><strong>User Type:</strong> {profileData.userType}</p>

                    {profileData.userType === "tenant" && (
                        <p><strong>Tenant ID:</strong> {profileData.tenant_id}</p>
                    )}
                    {profileData.userType === "landlord" && (
                        <p><strong>Landlord ID:</strong> {profileData.landlord_id}</p>
                    )}
                    {profileData.userType === "admin" && (
                        <>
                            <p><strong>Admin ID:</strong> {profileData.admin_id}</p>
                            <p><strong>Role:</strong> {profileData.role}</p>
                            <p><strong>Status:</strong> {profileData.status}</p>
                        </>
                    )}
                </div>
            ) : (
                <p>Loading profile details...</p>
            )}

            <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={() => router.push("/dashboard")}
            >
                Back to Dashboard
            </button>
        </div>
    );
}
