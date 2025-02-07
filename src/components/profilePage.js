"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../../hooks/useSession"; // Import authentication hook

export default function ProfilePage() {
    const { user, loading, error } = useAuth();
    const router = useRouter();
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        if (user) {
            console.log("🔍 [DEBUG] User Data from useSession:", user); // Log fetched user data
            setProfileData(user);
        }
    }, [user]);

    if (loading) return <p>Loading profile...</p>;
    if (!user) return <p>User not found. Please log in.</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Profile Information</h1>

            {profileData ? (
                <div className="space-y-3">
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
