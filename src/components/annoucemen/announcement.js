'use client'

import { useEffect, useState } from "react";
import LoadingScreen from "../../components/loadingScreen";
import useAuthStore from "../../zustand/authStore";

export default function Announcements({ userType }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();
    
    // Use the prop if provided, otherwise fallback to the store
    const effectiveUserType = userType || user?.userType;
    
    useEffect(() => {
        if (!effectiveUserType) {
            console.warn("User type is undefined. Skipping API call.");
            setLoading(false);
            return;
        }
        
        const fetchAnnouncements = async () => {
            try {
                setLoading(true);
                
                // Build the query parameters
                const params = new URLSearchParams();
                params.append("userType", effectiveUserType);
                
                // Add tenant ID if available
                if (effectiveUserType === "tenant" && user?.tenant_id) {
                    params.append("tenantId", user.tenant_id);
                }
                
                const response = await fetch(`/api/tenant/announcement/combined?${params}`, {
                    method: "GET",
                    headers: {
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        Pragma: "no-cache",
                        Expires: "0",
                    },
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log("API Response:", data);
                setAnnouncements(data);
            } catch (err) {
                console.error("Error fetching announcements:", err);
                setError(err.message || "Failed to load announcements");
            } finally {
                setLoading(false);
            }
        };
        
        fetchAnnouncements();
    }, [effectiveUserType, user?.tenant_id]);
    
    if (loading) return <LoadingScreen />;
    
    return (
        <div className="max-w-3xl mx-auto mt-6 bg-white shadow-lg rounded-lg p-4">
            <h2 className="text-xl font-semibold text-indigo-700 flex items-center">
                Announcements
            </h2>
            {error && (
                <p className="text-red-500 mt-2">Error: {error}</p>
            )}
            {announcements.length === 0 ? (
                <p className="text-gray-500 mt-2">No announcements at this time.</p>
            ) : (
                <ul className="mt-4 space-y-4">
                    {announcements.map((announcement, index) => (
                        <li key={announcement.id || index} className="border p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-medium text-gray-800">{announcement.title}</h3>
                                {announcement.source && (
                                    <span className={`text-xs px-2 py-1 rounded ${announcement.source === 'landlord' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                        {announcement.source === 'landlord' ? 'Property' : 'Admin'}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{announcement.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                                Posted on {new Date(announcement.created_at).toLocaleDateString()}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}