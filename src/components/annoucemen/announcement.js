"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "../../zustand/authStore";

export default function Announcements() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(
          `/api/tenant/announcement/combined?user_id=${user?.user_id}`
        );
        const sortedAnnouncements = response.data
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setAnnouncements(sortedAnnouncements);
      } catch (err) {
        setError("Failed to load announcements");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [user?.user_id]);

  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
  };

  const createExcerpt = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) return <p>Loading announcements...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
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
                className="p-5 border border-gray-200 rounded-xl shadow-sm bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
                onClick={() => handleAnnouncementClick(announcement)}
              >
                <h2 className="text-lg font-semibold text-gray-800">
                  {announcement.title}
                </h2>
                <p className="text-gray-700 mt-1">
                  {createExcerpt(announcement.message)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(announcement.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedAnnouncement.title}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(selectedAnnouncement.created_at).toLocaleString()}
            </p>
            <div className="mt-4 text-gray-700">
              {selectedAnnouncement.message}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
