'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import LandlordLayout from '../../../../../../components/navigation/sidebar-landlord';
import useAuth from '../../../../../../hooks/useSession';
import Swal from "sweetalert2";

export default function EditAnnouncement() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    property_id: ''
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user?.landlord_id || !id) return;
      
      console.log("Sending Update Request:", {
        subject: formData.subject,
        description: formData.description,
        property_id: formData.property
      });

      try {
        // Fetch announcement details
        const announcementRes = await fetch(`/api/landlord/announcement/viewAnnouncementbyId?id=${id}`);
        if (!announcementRes.ok) throw new Error('Failed to fetch announcement');
        const announcementData = await announcementRes.json();

        // Fetch properties for dropdown
        const propertiesRes = await fetch(`/api/landlord/announcement/fetchPropertyLists?landlord_id=${user?.landlord_id}`);
        if (!propertiesRes.ok) throw new Error('Failed to fetch properties');
        const propertiesData = await propertiesRes.json();

        setFormData({
          subject: announcementData.subject,
          description: announcementData.description,
          property_id: announcementData.property_id
        });
        setProperties(propertiesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError('Failed to load announcement data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await fetch(`/api/landlord/announcement/updateAnnouncement?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: formData.subject,
          description: formData.description,
          property_id: formData.property_id,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to update announcement");
      }
  
      Swal.fire("Updated!", "Announcement updated successfully.", "success");
      router.push(`/pages/landlord/announcement/${id}`);
    } catch (error) {
      console.error("Error updating announcement:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update announcement.",
      });
    }
  };

  if (loading) {
    return (
      <LandlordLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <Link 
              href={`/pages/landlord/announcement/${id}`}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Announcement
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6">Edit Announcement</h1>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="property_id" className="block text-gray-700 font-medium mb-2">
                  Property
                </label>
                <select
                  id="property_id"
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map(property => (
                    <option key={property.property_id} value={property.property_id}>
                      {property.property_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-4">
                <Link
                  href={`/pages/landlord/announcement/${id}`}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}