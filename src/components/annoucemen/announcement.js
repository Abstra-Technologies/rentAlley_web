"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Announcements({ user_id }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user_id) return;

    const fetchAnnouncements = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `/api/tenant/announcement/combined?user_id=${user_id}`
        );
        setAnnouncements(response.data);
      } catch (err) {
        setError("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [user_id]);

  if (loading) return <p>Loading announcements...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

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
              className="p-5 border border-gray-200 rounded-xl shadow-sm bg-gray-50 hover:bg-gray-100 transition"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {announcement.title}
              </h2>
              <p className="text-gray-700 mt-1">{announcement.message}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(announcement.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
