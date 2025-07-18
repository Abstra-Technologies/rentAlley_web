"use client";
import { useEffect, useState } from "react";
import usePropertyStore from "../../../../../../zustand/property/usePropertyStore";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import AmenitiesSelector from "../../../../../../components/amenities-selector";
import Swal from "sweetalert2";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { PROPERTY_TYPES } from "../../../../../../constant/propertyTypes";
import { PAYMENT_FREQUENCIES } from "../../../../../../constant/paymentFrequency";
import { PROVINCES_PHILIPPINES } from "../../../../../../constant/provinces";
import { UTILITY_BILLING_TYPES } from "../../../../../../constant/utilityBillingType";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";

const EditProperty = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const { updateProperty, setProperty } = usePropertyStore();

  const [formData, setFormData] = useState({
    propertyName: "",
    street: "",
    brgyDistrict: "",
    city: "",
    province: "",
    zipCode: "",
    propertyType: "",
    amenities: [],
    propDesc: "",
    floorArea: "",
    totalUnits: "",
    utilityBillingType: "",
    paymentFrequency: "",
    minStay: "",
    lateFee: "",
    petFriendly: false,
    bedSpacing: false,
    availBeds: "",
    assocDues: "",
  });

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await axios.get(
          `/api/propertyListing/editProperty?property_id=${id}`
        );
        console.log("Fetched Property Data:", response.data);
        const propertyData = response.data[0];

        setFormData({
          propertyName: propertyData?.property_name || "",
          propDesc: propertyData?.description || "",
          floorArea: propertyData?.floor_area || "",
          totalUnits: propertyData?.total_units || 1,
          street: propertyData?.street || "",
          brgyDistrict: propertyData?.brgy_district || "",
          city: propertyData?.city || "",
          province: propertyData?.province || "",
          zipCode: propertyData?.zip_code || "",
          // Convert amenities string to array
          amenities: propertyData?.amenities
            ? propertyData.amenities.split(",").map((amenity) => amenity.trim())
            : [],
          utilityBillingType: UTILITY_BILLING_TYPES.some(
            (p) => p.value === propertyData?.utility_billing_type
          )
            ? propertyData?.utility_billing_type
            : "",
          minStay: propertyData?.min_stay || 0,
          lateFee: propertyData?.late_fee || 0,
          petFriendly: propertyData?.pet_friendly === 1,
          assocDues: propertyData?.assoc_dues || 0,
          propertyType: PROPERTY_TYPES.some(
            (p) => p.value === propertyData?.property_type
          )
            ? propertyData?.property_type
            : "",
          paymentFrequency: PAYMENT_FREQUENCIES.some(
            (p) => p.value === propertyData?.payment_frequency
          )
            ? propertyData?.payment_frequency
            : "",
        });
      } catch (error) {
        console.error("Error fetching property:", error);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!id) return;
      try {
        const { data } = await axios.get(
          `/api/propertyListing/propertyPhotos?property_id=${id}`
        );

        setPhotos(data);
      } catch (error) {
        console.error("Error fetching photos:", error);
      }
    };

    fetchPhotos();
  }, [id]);

  const handleAmenityChange = (amenity) => {
    const currentAmenities = Array.isArray(formData.amenities)
      ? formData.amenities
      : [];
    const amenityIndex = currentAmenities.indexOf(amenity);

    let newAmenities;

    if (amenityIndex > -1) {
      newAmenities = [
        ...currentAmenities.slice(0, amenityIndex),
        ...currentAmenities.slice(amenityIndex + 1),
      ];
    } else {
      // Amenity doesn't exist, so add it
      newAmenities = [...currentAmenities, amenity];
    }

    setFormData((prev) => ({ ...prev, amenities: newAmenities }));
    setProperty({ amenities: newAmenities });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const uploadedFiles = Array.from(e.target.files);

    const newPhotos = uploadedFiles.map((file) => ({
      photo_id: null,
      photo_url: URL.createObjectURL(file),
      file: file,
      isNew: true,
    }));

    setPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]);
  };

  const handleDeletePhoto = async (photoId, index) => {
    if (photoId === null) {
      setPhotos((prevPhotos) => {
        const newPhotos = [...prevPhotos];
        const nullIdPhotos = newPhotos.filter((p) => p.photo_id === null);
        if (nullIdPhotos.length > 0) {
          const photoToRemove = nullIdPhotos[index % nullIdPhotos.length];
          return newPhotos.filter((p) => p !== photoToRemove);
        }
        return newPhotos;
      });
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to recover this photo!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(
            `/api/propertyListing/propPhotos?photo_id=${photoId}`
          );
          setPhotos(photos.filter((photo) => photo.photo_id !== photoId));
          Swal.fire("Deleted!", "Your photo has been deleted.", "success");
        } catch (error) {
          console.error("Error deleting photo:", error);
          Swal.fire("Error", "Failed to delete photo.", "error");
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save these changes?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, save it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          await axios.put(`/api/propertyListing/updateProperty?property_id=${id}`, {
            ...formData,
            petFriendly: formData.petFriendly ? 1 : 0,
          });
          updateProperty(id, formData);

          const newPhotos = photos.filter((photo) => photo.isNew && photo.file);

          if (newPhotos.length > 0) {
            const formDataPhotos = new FormData();
            formDataPhotos.append("property_id", id);

            newPhotos.forEach((photo) => {
              formDataPhotos.append("photos", photo.file);
            });

            await axios.post(
              "/api/propertyListing/uploadPropertyPhotos",
              formDataPhotos,
              {
                headers: { "Content-Type": "multipart/form-data" },
              }
            );
          }
          Swal.fire("Saved!", "Your property has been updated.", "success");
          router.push("/pages/landlord/property-listing");
        } catch (error) {
          console.error("Error updating property:", error);
          Swal.fire("Error", "Failed to update property.", "error");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCancel = () => {
    router.push("/pages/landlord/property-listing");
  };

  return (
    <LandlordLayout>
      <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10 relative">
        {/* Back Icon Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-2 left-2 flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <AiOutlineArrowLeft size={30} />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">
          Edit Property
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property Name */}
          <div>
            <label
              htmlFor="propertyName"
              className="block text-sm font-medium text-gray-700"
            >
              Property Name
            </label>
            <input
              type="text"
              id="propertyName"
              name="propertyName"
              value={formData.propertyName || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Street Address */}
          <div>
            <label
              htmlFor="street"
              className="block text-sm font-medium text-gray-700"
            >
              Street Address
            </label>
            <input
              type="text"
              name="street"
              id="street"
              value={formData.street || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Barangay / District */}
          <div>
            <label
              htmlFor="brgyDistrict"
              className="block text-sm font-medium text-gray-700"
            >
              Barangay / District
            </label>
            <input
              type="number"
              name="brgyDistrict"
              id="brgyDistrict"
              value={formData.brgyDistrict || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* City / Municipality */}
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700"
            >
              City / Municipality
            </label>
            <input
              type="text"
              name="city"
              id="city"
              value={formData.city || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Province */}
          <div>
            <label
              htmlFor="province"
              className="block text-sm font-medium text-gray-700"
            >
              Province
            </label>
            <select
              name="province"
              id="province"
              value={formData.province || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="" disabled>
                Select Province
              </option>
              {PROVINCES_PHILIPPINES.map((province) => (
                <option key={province.value} value={province.value}>
                  {province.label}
                </option>
              ))}
            </select>
          </div>

          {/* ZIP Code */}
          <div>
            <label
              htmlFor="zipCode"
              className="block text-sm font-medium text-gray-700"
            >
              ZIP Code
            </label>
            <input
              type="number"
              name="zipCode"
              id="zipCode"
              value={formData.zipCode || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Property Type */}
          <div>
            <label
              htmlFor="propertyType"
              className="block text-sm font-medium text-gray-700"
            >
              Property Type
            </label>
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="" disabled>
                Select Property Type
              </option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
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

          {/* Total Units */}
          <div>
            <label
              htmlFor="totalUnits"
              className="block text-sm font-medium text-gray-700"
            >
              Number of Units
            </label>
            <input
              type="text"
              name="totalUnits"
              id="totalUnits"
              value={formData.totalUnits || 1}
              min={1}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Property Description */}
          <div>
            <label
              htmlFor="propDesc"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              name="propDesc"
              id="propDesc"
              value={formData.propDesc || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            ></textarea>
          </div>

          {/* Floor Area */}
          <div>
            <label
              htmlFor="floorArea"
              className="block text-sm font-medium text-gray-700"
            >
              Floor Area (sqm)
            </label>
            <input
              type="number"
              name="floorArea"
              id="floorArea"
              value={formData.floorArea || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Utility Billing Type */}
          <div>
            <label
              htmlFor="utilityBillingType"
              className="block text-sm font-medium text-gray-700"
            >
              Utility Billing Type
            </label>
            <select
              name="utilityBillingType"
              id="utilityBillingType"
              value={formData.utilityBillingType || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="" disabled>
                Select Utility Billing Type
              </option>
              {UTILITY_BILLING_TYPES.map((utilityBillingType) => (
                <option
                  key={utilityBillingType.value}
                  value={utilityBillingType.value}
                >
                  {utilityBillingType.label}
                </option>
              ))}
            </select>
          </div>

          {/* Minimum Stay (Months) */}
          <div>
            <label
              htmlFor="minStay"
              className="block text-sm font-medium text-gray-700"
            >
              Minimum Stay (Months)
            </label>
            <input
              type="number"
              name="minStay"
              id="minStay"
              value={formData.minStay || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Late Fee (%) */}
          <div>
            <label
              htmlFor="lateFee"
              className="block text-sm font-medium text-gray-700"
            >
              Late Fee (%)
            </label>
            <input
              type="number"
              name="lateFee"
              id="lateFee"
              value={formData.lateFee || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Rent Payment */}
          <div>
            <label
              htmlFor="assocDues"
              className="block text-sm font-medium text-gray-700"
            >
              Association Dues
            </label>
            <input
              type="number"
              name="assocDues"
              id="assocDues"
              value={formData.assocDues}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Pet-Friendly Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="petFriendly"
              id="petFriendly"
              checked={formData.petFriendly}
              onChange={handleChange}
              className="h-6 w-6"
            />
            <label htmlFor="petFriendly" className="text-gray-700">
              Pet-Friendly
            </label>
          </div>

          {/* Payment Frequency */}
          <div>
            <label
              htmlFor="paymentFrequency"
              className="block text-sm font-medium text-gray-700"
            >
              Payment Frequency
            </label>
            <select
              name="paymentFrequency"
              id="paymentFrequency"
              value={formData.paymentFrequency || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="" disabled>
                Select Payment Frequency
              </option>
              {PAYMENT_FREQUENCIES.map((paymentFrequency) => (
                <option
                  key={paymentFrequency.value}
                  value={paymentFrequency.value}
                >
                  {paymentFrequency.label}
                </option>
              ))}
            </select>
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
                {photos?.map((photo, index) => (
                  <div
                    key={
                      photo?.photo_id
                        ? `existing-${photo.photo_id}`
                        : `new-${index}`
                    }
                    className="relative"
                  >
                    {photo?.photo_url ? (
                      <Image
                        src={photo.photo_url}
                        alt="Property"
                        width={100}
                        height={80}
                        className="w-full h-20 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-20 bg-gray-200 flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full text-xs"
                      onClick={() => handleDeletePhoto(photo.photo_id, index)}
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
              className="bg-white text-gray-700 border border-gray-500 px-4 py-2 rounded-md hover:bg-gray-200"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </LandlordLayout>
  );
};

export default EditProperty;
