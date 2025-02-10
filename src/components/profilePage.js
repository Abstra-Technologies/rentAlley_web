"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../hooks/useSession";
import { UserIcon, ShieldCheckIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import axios from "axios";

export default function ProfilePage() {
    const { user, loading, error } = useAuth();
    const router = useRouter();

    const [profileData, setProfileData] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [profilePicture, setProfilePicture] = useState("");
    const [editing, setEditing] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordError, setPasswordError] = useState("");

    useEffect(() => {
        if (user) {
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

<<<<<<< Updated upstream
    const handleFileChange = async (event) => {
=======
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    const handleChangePassword = async () => {
        setPasswordError("");

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError("All fields are required.");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters long.");
            return;
        }

        try {
            const response = await axios.post("/api/profile/changePassword", passwordData, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            });

            alert("Password changed successfully!");
            setTimeout(() => {
                router.push("/pages/auth/login");
            }, 2000);
            setShowPasswordModal(false); // Close modal
        } catch (error) {
            console.error("Password change failed:", error);
            setPasswordError(error.response?.data?.message || "Failed to change password.");
        }
    };



    //file change for profile pic
    const handleFileChange = (event) => {
>>>>>>> Stashed changes
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
            setProfileData((prev) => ({ ...prev, profilePicture: response.data.imageUrl }));
            console.log("✅ Image uploaded:", response.data.imageUrl);
        } catch (error) {
            console.error("❌ Upload failed:", error);
        }
        setUploading(false);
    };

    const handleUpdateProfile = async () => {
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
    if (!user) return <p>User not found. Please log in.</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <div className="w-64 bg-white border-r border-gray-200 py-4 px-6">
                <h2 className="text-2xl font-semibold text-blue-600 mb-6">Menu</h2>
                <nav>
                    <ul>
                        <li className="py-2 hover:bg-gray-100 rounded-md transition-colors duration-200">
                            <a href="#" className="flex items-center space-x-2 text-gray-700">
                                <UserIcon className="h-5 w-5" />
                                <span>Profile</span>
                            </a>
                        </li>
                        <li className="py-2 hover:bg-gray-100 rounded-md transition-colors duration-200">
                            <a href="#" className="flex items-center space-x-2 text-gray-700">
                                <ShieldCheckIcon className="h-5 w-5" />
                                <span>Security & Privacy</span>
                            </a>
                        </li>
                        <li className="py-2 hover:bg-gray-100 rounded-md transition-colors duration-200">
                            <a href="#" className="flex items-center space-x-2 text-gray-700">
                                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                <span>Logout</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className="flex-1 p-8">
                <h1 className="text-3xl font-semibold text-blue-600 mb-8">Profile</h1>
                <div className="max-w-2xl mx-auto">
                <div className="flex flex-col items-center">
                <div className="flex flex-col items-center relative">
    <label className="relative cursor-pointer group">
        {/* Profile Picture */}
        <img 
            src={profilePicture} 
            alt="Profile" 
            className="w-32 h-32 rounded-full object-cover border border-gray-300 shadow-md"
        />
        
        {/* Hidden File Input */}
        <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="hidden"
        />
        
        {/* Change Picture Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 
                        group-hover:bg-opacity-50 rounded-full transition-all duration-300">
            <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 
                           transition-opacity duration-300">
                Change Picture
            </span>
        </div>
    </label>
</div>
            </div>

                    <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Welcome, {user?.firstName}!</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            {editing ? (
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        ) : (
                            <input type="text" value={profileData?.firstName} className="text-gray-400 w-full p-2 border rounded-md"/>
                        )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            {editing ? (
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        ) : (
                            <input type="text" value={profileData?.lastName} className="text-gray-400 w-full p-2 border rounded-md"/>
                        )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email (Read-Only)</label>
                            <input type="text" value={profileData?.email} className="text-gray-400 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                            {editing ? (
                        <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-2 border rounded-md" />
                    ) : (
                        <input type="text" name="phoneNumber" value={profileData?.phoneNumber || "Not provided"} className="text-gray-400 w-full p-2 border rounded-md"/>
                    )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">User Type (Read-Only)</label>
                            <input type="text" value={user.userType} className="text-gray-400 w-full p-2 border rounded-md" />
                        </div>
                    </div>

                    <div className="flex justify-between mt-4">
                <button className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">Delete Account</button>
                {editing ? (
                    <button onClick={handleUpdateProfile} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                        Save Changes
                    </button>
                ) : (
                    <button onClick={() => setEditing(true)} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                        Edit Profile
                    </button>
                )}
                <button onClick={() => setShowPasswordModal(true)}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">Change Password
                </button>
                {showPasswordModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
                            <input type="password" placeholder="Current Password" value={passwordData.currentPassword}
                                   onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                   className="w-full p-2 border rounded-md mb-2"/>
                            <input type="password" placeholder="New Password" value={passwordData.newPassword}
                                   onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                   className="w-full p-2 border rounded-md mb-2"/>
                            <input type="password" placeholder="Confirm Password" value={passwordData.confirmPassword}
                                   onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                   className="w-full p-2 border rounded-md mb-2"/>
                            <div className="flex justify-end space-x-2">
                                <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 bg-gray-500 text-white rounded-md">Close</button>
                                <button onClick={handleChangePassword} className="px-4 py-2 bg-green-500 text-white rounded-md">Save</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
                </div>
            </div>
        </div>
    );
}