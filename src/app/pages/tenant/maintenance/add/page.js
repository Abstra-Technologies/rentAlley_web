"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../../../../../hooks/useSession";

export default function MaintenanceRequestPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await axios.get("/api/maintenance/getCategory");
        setCategories(response.data.category);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, []);

  const handleFileChange = (e) => {
    setPhotos([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory || !subject || !description) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // Step 1: Create Maintenance Request
      const maintenanceRes = await axios.post("/api/maintenance/create", {
        tenant_id: user.tenant_id,
        property_id: propertyId || null,
        unit_id: unitId || null,
        subject,
        description,
        category: selectedCategory,
      });

      const requestId = maintenanceRes.data.request_id;

      // Step 2: Upload Photos if any
      if (photos.length > 0) {
        const formData = new FormData();
        formData.append("property_id", propertyId);
        formData.append("unit_id", unitId);
        formData.append("request_id", requestId);

        photos.forEach((photo) => {
          formData.append("photos", photo);
        });

        await axios.post("/api/maintenance/uploadPhotos", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      alert("Maintenance request submitted successfully!");
    } catch (error) {
      console.error("Error submitting maintenance request:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg md:max-w-2xl">
        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800">
          Submit Maintenance Request
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-gray-700 font-medium">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              required
              className="w-full p-2 border rounded-lg"
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-gray-700 font-medium">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full p-2 border rounded-lg"
              placeholder="Enter subject"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-medium">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full p-2 border rounded-lg"
              rows="4"
              placeholder="Describe the issue"
            />
          </div>

          {/* Upload Photos */}
          <div>
            <label className="block text-gray-700 font-medium">
              Upload Photos
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}
