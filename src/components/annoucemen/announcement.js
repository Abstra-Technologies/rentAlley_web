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
        setAnnouncements(response.data);
      } catch (err) {
        setError("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading) return <p>Loading announcements...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Announcements</h1>
      {announcements.length === 0 ? (
        <p>No announcements available.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((announcement) => (
            <li
              key={announcement.announcement_id}
              className="p-4 border rounded-lg shadow"
            >
              <h2 className="font-semibold text-lg">{announcement.title}</h2>
              <p className="text-gray-700">{announcement.message}</p>
              <p className="text-sm text-gray-500">
                {new Date(announcement.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
