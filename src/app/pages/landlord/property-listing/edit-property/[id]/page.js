"use client";
import { useEffect, useState } from "react";
import usePropertyStore from "../../../../../../pages/zustand/propertyStore";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import AmenitiesSelector from "../../../../../../components/amenities-selector";

const EditProperty = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // Property ID from URL

  // Zustand State
  const { properties, updateProperty, setProperty } = usePropertyStore();

  // Local State for Form Inputs
  const [formData, setFormData] = useState({
    propertyName: "",
    propDesc: "",
    floorArea: "",
    unit: "",
    street: "",
    brgyDistrict: "",
    city: "",
    province: "",
    zipCode: "",
    rentPayment: "",
    advancedPayment: "",
    secDeposit: "",
    minStay: "",
    lateFee: "",
    petFriendly: false,
    bedSpacing: false,
    availBeds: "",
    hasElectricity: false,
    hasWater: false,
    hasAssocDues: false,
    propertyType: "",
    furnish: "",
    amenities: [], // Ensure it's an array
  });
  const [photos, setPhotos] = useState([]); // For uploaded photos
  const [propertyTypes, setPropertyTypes] = useState([]); // Dynamic Property Types
  const [furnishOptions, setFurnishOptions] = useState([]); // Dynamic Furnish Options
  const [loading, setLoading] = useState(false);

  // Fetch Property Details on Load
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await axios.get(
          `/api/propertyListing/propListing?property_id=${id}`
        );
        // Debugging
        console.log("Fetched Property Data:", response.data);
        const propertyData = response.data[0];

        setFormData({
          propertyName: propertyData?.property_name || "",
          propDesc: propertyData?.prop_desc || "",
          floorArea: propertyData?.floor_area || "",
          unit: propertyData?.unit || "",
          street: propertyData?.street || "",
          brgyDistrict: propertyData?.brgy_district || "",
          city: propertyData?.city || "",
          province: propertyData?.province || "",
          zipCode: propertyData?.zip_code || "",
          rentPayment: propertyData?.rent_payment || "",
          advancedPayment: propertyData?.advanced_payment || "",
          secDeposit: propertyData?.sec_deposit || "",
          minStay: propertyData?.min_stay || "",
          lateFee: propertyData?.late_fee || "",
          petFriendly: propertyData?.pet_friendly === 1,
          bedSpacing: propertyData?.bed_spacing === 1,
          availBeds: propertyData?.avail_beds ?? "",
          hasElectricity: propertyData?.has_electricity === 1,
          hasWater: propertyData?.has_water === 1,
          hasAssocDues: propertyData?.has_assocdues === 1,
          propertyType: propertyData?.property_type || "", // Set selected property type
          furnish: propertyData?.furnish || "", // Set selected furnish option
          // Convert amenities string to array
          amenities: propertyData?.amenities
            ? propertyData.amenities.split(",").map((amenity) => amenity.trim())
            : [],
        });
      } catch (error) {
        console.error("Error fetching property:", error);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  // Fetch Property Types, Furnish Options, and Photos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, furnishRes] = await Promise.all([
          axios.get("/api/propertyListing/propertyTypes"),
          axios.get("/api/propertyListing/furnishOptions"),
        ]);

        setPropertyTypes(typesRes.data.propertyTypes);
        setFurnishOptions(furnishRes.data.furnishOptions);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchPhotos = async () => {
      if (!id) return;
      try {
        const { data } = await axios.get(
          `/api/propertyListing/propPhotos?property_id=${id}`
        );

        setPhotos(data);
      } catch (error) {
        console.error("Error fetching photos:", error);
      }
    };

    fetchData();
    fetchPhotos();
  }, [id]);

  // Handle Amenities Change
  const handleAmenityChange = (amenity) => {
    const currentAmenities = Array.isArray(formData.amenities)
      ? formData.amenities
      : [];
    const amenityIndex = currentAmenities.indexOf(amenity);

    let newAmenities;

    if (amenityIndex > -1) {
      // Amenity already exists, so remove it
      newAmenities = [
        ...currentAmenities.slice(0, amenityIndex),
        ...currentAmenities.slice(amenityIndex + 1),
      ];
    } else {
      // Amenity doesn't exist, so add it
      newAmenities = [...currentAmenities, amenity];
    }

    setFormData((prev) => ({ ...prev, amenities: newAmenities })); // Update local form data
    setProperty({ amenities: newAmenities }); // Update the zustand store
  };

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle File Upload
  const handleFileChange = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setPhotos((prevPhotos) => [...prevPhotos, ...uploadedFiles]);
  };

  // Submit Form (Update Property)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update Property Details
      await axios.put(`/api/propertyListing/propListing?id=${id}`, {
        ...formData,
        petFriendly: formData.petFriendly ? 1 : 0,
        bedSpacing: formData.bedSpacing ? 1 : 0,
      });
      updateProperty(id, formData);

      // Upload Photos if Any
      if (photos.length > 0 && photos.some((photo) => photo instanceof File)) {
        const formDataPhotos = new FormData();
        formDataPhotos.append("property_id", id);
        photos.forEach((photo) => {
          if (photo instanceof File) {
            formDataPhotos.append("photos", photo);
          }
        });

        await axios.post("/api/propertyListing/propPhotos", formDataPhotos, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      alert("Property updated successfully!");
      router.push("/pages/landlord/property-listing"); // Redirect
    } catch (error) {
      console.error("Error updating property:", error);
      alert("Failed to update property.");
    } finally {
      setLoading(false);
    }
  };

  // Delete Photo
  const handleDeletePhoto = async (photoId) => {
    try {
      await axios.delete(`/api/propertyListing/propPhotos?photo_id=${photoId}`);
      setPhotos(photos.filter((photo) => photo.photo_id !== photoId));
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  // Cancel Edit
  const handleCancel = () => {
    router.push("/pages/landlord/property-listing"); // Redirect to property list
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Edit Property
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Property Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Property Name
          </label>
          <input
            type="text"
            name="propertyName"
            value={formData.propertyName || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Property Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="propDesc"
            value={formData.propDesc || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          ></textarea>
        </div>

        {/* Floor Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Floor Area (sqm)
          </label>
          <input
            type="number"
            name="floorArea"
            value={formData.floorArea || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Unit
          </label>
          <input
            type="text"
            name="unit"
            value={formData.unit || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Street Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Street Address
          </label>
          <input
            type="text"
            name="street"
            value={formData.street || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Barangay / District */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Barangay / District
          </label>
          <input
            type="number"
            name="brgyDistrict"
            value={formData.brgyDistrict || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* City / Municipality */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            City / Municipality
          </label>
          <input
            type="text"
            name="city"
            value={formData.city || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* province */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Province
          </label>
          <input
            type="text"
            name="province"
            value={formData.province || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* ZIP Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            ZIP Code
          </label>
          <input
            type="number"
            name="zipCode"
            value={formData.zipCode || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
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

        {/* Advanced Payment (Months) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Advanced Payment (Months)
          </label>
          <input
            type="number"
            name="advancedPayment"
            value={formData.advancedPayment || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Security Deposit (Amount) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Security Deposit (Amount)
          </label>
          <input
            type="number"
            name="secDeposit"
            value={formData.secDeposit || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Minimum Stay (Months) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Minimum Stay (Months)
          </label>
          <input
            type="number"
            name="minStay"
            value={formData.minStay || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Late Fee (%) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Late Fee (%)
          </label>
          <input
            type="number"
            name="lateFee"
            value={formData.lateFee || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Pet-Friendly Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="petFriendly"
            checked={formData.petFriendly}
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
            checked={formData.bedSpacing}
            onChange={handleChange}
            className="h-6 w-6"
          />
          <label className="text-gray-700">Bed Spacing (if applicable)</label>
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

        {/* Water Bill Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="hasWater"
            checked={formData.hasWater}
            onChange={handleChange}
            className="h-6 w-6"
          />
          <label className="text-gray-700">Water Bill</label>
        </div>

        {/* Electricity Bill Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="hasElectricity"
            checked={formData.hasElectricity}
            onChange={handleChange}
            className="h-6 w-6"
          />
          <label className="text-gray-700">Electricity Bill</label>
        </div>

        {/* Association Dues Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="hasAssocDues"
            checked={formData.hasAssocDues}
            onChange={handleChange}
            className="h-6 w-6"
          />
          <label className="text-gray-700">Association Dues</label>
        </div>

        {/* Property Type (Dynamic from API) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Property Type
          </label>
          <select
            name="propertyType"
            value={formData.propertyType || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Type</option>
            {propertyTypes?.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Furnish Option (Dynamic from API) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Furnish Option
          </label>
          <select
            name="furnish"
            value={formData.furnish || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Furnish Option</option>
            {furnishOptions?.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Amenities */}
        <div className="mb-6">
          <AmenitiesSelector
            selectedAmenities={formData.amenities || []}
            onAmenityChange={handleAmenityChange}
          />
        </div>

        {/* Upload Property Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Property Photos
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="mt-2"
          />
        </div>

        {/* Display Existing Photos */}
        {photos.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Existing Photos:</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {photos?.map((photo) => (
                <div key={photo.photo_id} className="relative">
                  <img
                    src={photo.photo_url}
                    alt="Property"
                    className="w-full h-20 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full text-xs"
                    onClick={() => handleDeletePhoto(photo.photo_id)}
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
  );
};

export default EditProperty;
