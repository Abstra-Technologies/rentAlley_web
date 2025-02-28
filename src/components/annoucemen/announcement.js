'use client'

import { useEffect, useState } from "react";
import axios from "axios";
import LoadingScreen from "../../components/loadingScreen";
import useAuth from "../../../hooks/useSession";
import useAuthStore from "../../zustand/authStore";

export default function Announcements({ userType }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {user} = useAuthStore();

    useEffect(() => {

        if (!user?.userType) {
            console.warn("User type is undefined. Skipping API call.");
            setLoading(false);
            return;
        }

        const fetchAnnouncements = async () => {
            try {
                setLoading(true);

                const response = await fetch(`/api/tenant/announcement/list?userType=${user.userType}`, {
                    method: "GET",
                    headers: {
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                        Pragma: "no-cache",
                        Expires: "0",
                    },
                });

                if (!response.ok) {
                     new Error(`HTTP error! Status: ${response.status}`);
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
    }, [user?.userType]);


    if (loading) return <LoadingScreen />;

    return (
        <div className="max-w-3xl mx-auto mt-6 bg-white shadow-lg rounded-lg p-4">
            <h2 className="text-xl font-semibold text-indigo-700 flex items-center">
                Announcements
            </h2>
            {announcements.length === 0 ? (
                <p className="text-gray-500 mt-2">No announcements at this time.</p>
            ) : (
                <ul className="mt-4 space-y-4">
                    {announcements?.map((announcement, index) => (
                        <li key={announcement.id || index} className="border p-4 rounded-lg shadow-sm">
                            <h3 className="text-lg font-medium text-gray-800">{announcements.title}</h3>
                            <p className="text-sm text-gray-600">{announcement.message}</p>
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
