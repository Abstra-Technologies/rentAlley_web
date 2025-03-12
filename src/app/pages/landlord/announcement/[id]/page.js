'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import LandlordLayout from '../../../../../components/navigation/sidebar-landlord';
import useAuth from '../../../../../../hooks/useSession';
import Swal from "sweetalert2";

export default function ViewAnnouncement() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchAnnouncement() {
      if (!user?.landlord_id || !id) return;

      try {
        console.log("Fetching announcement with ID:", id, "for Landlord ID:", user.landlord_id);
        const response = await fetch(`/api/landlord/announcement/view-announcement?id=${id}`);
        if (!response.ok) throw new Error('Failed to fetch announcement');
        const data = await response.json();
        console.log("Fetched Announcement:", data);
        setAnnouncement(data);
      } catch (error) {
        console.error("Error fetching announcement:", error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Failed to load announcement. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }

    if (user?.landlord_id && id) {
      fetchAnnouncement();
    }
  }, [user, id]);

  const handleEdit = () => {
    router.push(`/pages/landlord/announcement/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/landlord/announcement/delete-announcement?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      router.push('/pages/landlord/announcement');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to delete announcement. Please try again.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Loading announcement...</div>
        </div>
      </LandlordLayout>
    );
  }

  if (!announcement) {
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Announcement not found.</div>
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <Link href="/pages/landlord/announcement" className="flex items-center text-gray-600 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Announcements
            </Link>
            <div className="flex gap-4">
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:bg-red-300"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-4">{announcement.subject}</h1>
            <div className="text-sm text-gray-500 mb-6">
              Posted on {new Date(announcement.created_at).toLocaleDateString()}
            </div>
            <div className="text-gray-700 whitespace-pre-wrap">{announcement.description}</div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}