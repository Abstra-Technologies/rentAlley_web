"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "../../zustand/authStore";

export default function Announcements() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(
          `/api/tenant/announcement/combined?user_id=${user?.user_id}`
        );
        const sortedAnnouncements = response.data
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAnnouncements(sortedAnnouncements);
      } catch (err) {
        setError("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [user?.user_id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) return (
    <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 h-full flex justify-center items-center">
      <div className="animate-pulse text-gray-500">Loading announcements...</div>
    </div>
  );
  
  if (error) return (
    <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 h-full">
      <p className="text-red-500">{error}</p>
    </div>
  );

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 h-full">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Announcements
      </h2>
      {announcements.length === 0 ? (
        <p className="text-gray-600">No announcements available.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((announcement) => (
            <li
              key={announcement.unique_id}
              className="p-5 border border-gray-200 rounded-xl shadow-sm bg-gray-50 transition"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {announcement.title}
              </h2>
              <p className="text-sm text-gray-500 mb-2">
                {formatDate(announcement.created_at)}
              </p>
              <div className="text-gray-700 prose max-w-none">
                {announcement.message}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}