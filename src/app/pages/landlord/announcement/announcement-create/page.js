'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LandlordLayout from '../../../../../components/navigation/sidebar-landlord';
import useAuth from "../../../../../../hooks/useSession";
import Swal from "sweetalert2";

export default function CreateAnnouncement() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    property: "",
    subject: "",
    description: ""
  });

  useEffect(() => {
    async function fetchProperties() {
      try {
        if (!user?.landlord_id) {
          console.error('No landlord ID found in user data');
          return;
        }

        const response = await fetch(`/api/landlord/announcement/retrieve-announcement?landlord_id=${user.landlord_id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        
        const data = await response.json();
        setProperties(data);
      } catch (error) {
        console.error("Error fetching properties:", error);
        alert("Failed to load properties. Please try again.");
      }
    }

    fetchProperties();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.property || !formData.subject || !formData.description) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("/api/landlord/announcement/create-announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: formData.property,
          subject: formData.subject,
          description: formData.description,
          landlord_id: user.landlord_id
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // alert("Announcement created successfully!");
        setFormData({
          property: "",
          subject: "",
          description: ""
        
        });

        Swal.fire(
          "Successfully Created",
          "Your announcement has been listed.",
          "success"
        );

        router.push('/pages/landlord/announcement');
      } else {
        alert(data.message || "Failed to create announcement");
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      alert("Failed to create announcement. Please try again.");
    }
  };

  if (!user?.landlord_id) {
    return <div>Loading...</div>;
  }

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-6">
          <div className="mb-6">
            <Link href="/pages/landlord/announcement" className="flex items-center text-gray-600 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Announcements
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-6">Create New Announcement</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.property}
                  onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                  required
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.property_id} value={property.property_id}>
                      {property.property_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Create Announcement
              </button>
            </form>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}