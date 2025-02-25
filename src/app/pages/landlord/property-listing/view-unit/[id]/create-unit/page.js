"use client";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LandlordLayout from "../../../../../../../components/navigation/sidebar-landlord";
import { useEffect } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";

export default function UnitListingForm() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property_id");
  const [formData, setFormData] = useState({
    property_id: propertyId ,
    unitName: "",
    description: "",
    floorArea: "",
    petFriendly: false,
    bedSpacing: "",
    availBeds: "",
    rentPayment: "",
    minStay: "",
    lateFee: "",
    secDeposit: "",
    advancedPayment: "",
    hasElectricity: false,
    hasWater: false,
    hasAssocdues: false,
    furnish: "",
  });
  const [furnishOptions, setFurnishOptions] = useState([]);
  const [photos, setPhotos] = useState([]); // State for selected files
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchFurnishOptions = async () => {
      try {
        const response = await axios.get("/api/unitListing/furnishOptions");

        const data = response.data;
        setFurnishOptions(data.furnishOptions);
      } catch (error) {
        console.error("Error fetching furnish options:", error);
      }
    };

    fetchFurnishOptions();
  }, []);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Function to handle files selected by Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop: (acceptedFiles) => {
      setPhotos((prevFiles) => [...prevFiles, ...acceptedFiles]);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const propURL = `/pages/landlord/property-listing/view-unit/${propertyId}`;
    try {
      const unitResponse = await axios.post("/api/unitListing/unit", formData);

      const unitData = unitResponse.data;
      const unitId = unitData.unitId; // Get the unitId from the response

      // 2. Upload Photos
      if (photos.length > 0) {
        const photoFormData = new FormData();
        photos.forEach((photo) => {
          photoFormData.append("photos", photo);
        });
        photoFormData.append("unit_id", unitId);

        const photoResponse = await axios.post(
          "/api/unitListing/unitPhoto",
          photoFormData
        );

        console.log("Photos uploaded:", photoResponse.data);
      }

      alert("Unit created successfully!");
      router.push(propURL); // Redirect to the units list
    } catch (error) {
      console.error("Error creating unit:", error);
      alert(`Error creating unit: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    const propURL = `/pages/landlord/property-listing/${propertyId}/view-unit`;
    router.back(propURL);
  };

  return (
    <LandlordLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        {/* Create Unit Form */}

        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Create Unit
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Unit Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unit Name
            </label>
            <input
              type="text"
              name="unitName"
              value={formData.unitName || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Description  */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Floor Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Floor Area
            </label>
            <input
              type="number"
              name="floorArea"
              value={formData.floorArea || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium mb-1">
              Additional Features
            </label>

            {/* Pet-Friendly Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="petFriendly"
                checked={formData.petFriendly} // Ensure it checks based on 1
                onChange={handleChange}
                className="h-6 w-6"
              />
              <label className="text-gray-700">Pet-Friendly</label>
            </div>

            {/* Bed Spacing Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="bedSpacing"
                checked={formData.bedSpacing} // Ensure it checks based on 1
                onChange={handleChange}
                className="h-6 w-6"
              />
              <label className="text-gray-700">
                Bed Spacing (if applicable)
              </label>
            </div>

            {/* Show Input for Available Bed Spacing */}
            {formData.bedSpacing && (
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Available Bed Spacing (in number)
                </label>
                <input
                  type="number"
                  name="availBeds"
                  value={formData.availBeds || ""}
                  onChange={handleChange}
                  placeholder="Enter available bed spacing"
                  className="w-full p-2 border rounded"
                />
              </div>
            )}
          </div>

          {/* Rent Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rent Payment
            </label>
            <input
              type="number"
              name="rentPayment"
              value={formData.rentPayment || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Minimum Stay */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Stay (months)
            </label>
            <input
              type="number"
              name="minStay"
              value={formData.minStay || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Late Fee */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Late Fee
            </label>
            <input
              type="number"
              name="lateFee"
              value={formData.lateFee || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Security Deposit */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Security Deposit
            </label>
            <input
              type="number"
              name="secDeposit"
              value={formData.secDeposit || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Advanced Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Advanced Payment (in months)
            </label>
            <input
              type="number"
              name="advancedPayment"
              value={formData.advancedPayment || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Utility Bill (Check if included)
            </label>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  id="hasWater"
                  type="checkbox"
                  name="hasWater"
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-6 w-6"
                  checked={formData.hasWater}
                  onChange={handleChange}
                />
                <span className="ml-3 text-lg text-gray-700">Water Bill</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  id="hasElectricity"
                  type="checkbox"
                  name="hasElectricity"
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-6 w-6"
                  checked={formData.hasElectricity}
                  onChange={handleChange}
                />
                <span className="ml-3 text-lg text-gray-700">
                  Electricity Bill
                </span>
              </label>
            </div>
            <label
              htmlFor="hasAssocdues"
              className="block text-sm font-medium text-gray-700"
            >
              Others
            </label>
            <label className="inline-flex items-center">
              <input
                id="hasAssocdues"
                type="checkbox"
                name="hasAssocdues"
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-6 w-6"
                checked={formData.hasAssocdues}
                onChange={handleChange}
              />
              <span className="ml-3 text-lg text-gray-700">
                Association Dues
              </span>
            </label>
          </div>

          {/* Furnish (Dynamic from API) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Furnishing
            </label>
            <select
              name="furnish"
              value={formData.furnish || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Furnishing</option>
              {furnishOptions?.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`dropzone w-full p-4 border-2 border-dashed rounded-md border-gray-400 transition duration-200 ease-in-out ${
              isDragActive ? "border-blue-500" : "border-gray-400"
            } flex flex-col items-center justify-center space-y-2 cursor-pointer`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-blue-500">Drop the unit photos here...</p>
            ) : (
              <p className="text-gray-500">
                Drag 'n' drop unit photos here, or click to select
              </p>
            )}
          </div>

          {/* Display Existing Photos */}
          {photos.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Existing Photos:</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {photos?.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt="Property"
                      className="w-full h-20 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full text-xs"
                      onClick={() => {
                        const newPhotos = [...photos];
                        newPhotos.splice(index, 1);
                        setPhotos(newPhotos);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-6">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </LandlordLayout>
  );
}
