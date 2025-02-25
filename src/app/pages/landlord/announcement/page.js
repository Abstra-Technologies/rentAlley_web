'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LandlordLayout from '../../../../components/navigation/sidebar-landlord';
import useAuth from '../../../../../hooks/useSession';


export default function AnnouncementsList() {
const router = useRouter();
const { user } = useAuth();
const [announcements, setAnnouncements] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchAnnouncements() {
    try {

      const response = await fetch(`/api/landlord/announcement/get-announcement?landlord_id=${user?.landlord_id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      
      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      alert("Failed to load announcements. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  fetchAnnouncements();
}, [user]);

const handleCreate = () => {
  router.push(`/pages/landlord/announcement/announcement-create`);
};

if (loading) {
  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading announcements...</div>
      </div>
    </LandlordLayout>
  );
}

return (
  <LandlordLayout>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Create Announcement
          </button>
        </div>

        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
              No announcements found.
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-lg shadow hover:shadow-lg transition duration-200 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm text-gray-600">{announcement.property}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{announcement.subject}</h3>
                    <p className="text-gray-600 line-clamp-2">{announcement.description}</p>
                  </div>
                  <Link
                    href={`/pages/landlord/announcement/${announcement.id}`}
                    className="p-2 hover:bg-gray-100 rounded-full transition duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </LandlordLayout>
);
}