import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { FaCheck, FaImage } from "react-icons/fa"; // Import checkmark icon from react-icons
import { useDropzone } from "react-dropzone";
import usePropertyStore from "../pages/zustand/propertyStore";
import axios from "axios";
import Camera from "./lib/camera";
import DropzoneUploader from "./dropzone-uploader";
import AmenitiesSelector from "./amenities-selector";
import { z } from "zod";

const steps = [
  { id: 1, label: "Location" },
  { id: 2, label: "Amenities/Features" },
  { id: 3, label: "Property Photos" },
  { id: 4, label: "Requirements" },
];

const propertySchema = z.object({
  propertyName: z.string().min(1, "Property Name is required"),
  street: z.string().min(1, "Street Address is required"),
  brgyDistrict: z.string().min(1, "Barangay/District is required"),
  city: z.string().min(1, "City/Municipality is required"),
  zipCode: z.string().min(1, "ZIP Code is required"),
  province: z.string().min(1, "Province is required"),
});

// StepCounter component
const StepCounter = ({ currentStep }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 p-4 rounded-xl shadow-md">
      {steps.map((step) => (
        <div
          key={step.id}
          className="flex-1 flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-center"
        >
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm ${
              step.id < currentStep
                ? "bg-green-500 text-white"
                : step.id === currentStep
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {step.id < currentStep ? <FaCheck className="w-4 h-4" /> : step.id}
          </div>
          <div
            className={`text-center text-sm font-medium mt-2 sm:mt-0 sm:ml-4 ${
              step.id === currentStep
                ? "text-blue-500"
                : step.id < currentStep
                ? "text-green-500"
                : "text-gray-500"
            }`}
          >
            {step.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepCounter;

const fetcher = (url) => axios.get(url).then((res) => res.data);

// Steps as individual components
export const StepOne = () => {
  const { property, setProperty } = usePropertyStore();
  const [errors, setErrors] = useState({});

  // Use SWR to fetch property types
  const { data, error } = useSWR("/api/propertyListing/propertyTypes", fetcher);

  // Update Zustand store when data is available
  useEffect(() => {
    if (data?.propertyTypes?.length) {
      setProperty({
        propertyType: property.propertyType || data.propertyTypes[0],
      });
    }
  }, [data, setProperty, property.propertyType]);

  // Added Form Validations
  const validateField = (name, value) => {
    const result = propertySchema.safeParse({ ...property, [name]: value });
    if (!result.success) {
      const fieldErrors = result.error.format();
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[name]?._errors?.[0] || "",
      }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (error) return <p>Failed to load property types.</p>;
  if (!data) return <p>Loading property types...</p>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProperty({ ...property, [name]: value });
    validateField(name, value);
  };

  return (
    <div>
      <h1 className="mt-5 text-3xl font-bold mb-4">List New Property</h1>
      <p className="text-gray-600 mb-4">
        List it in the market where renters are waiting!
      </p>

      {/* Form Fields */}
      <form className="space-y-4">
        {/* Property Type Dropdown */}
        <div>
          <label
            htmlFor="propertyType"
            className="block text-sm font-medium text-gray-700"
          >
            Property Type
          </label>
          <select
            id="propertyType"
            name="propertyType"
            value={property.propertyType || ""}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm text-lg py-2 px-4 focus:ring-blue-500 focus:border-blue-500"
          >
            {data.propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

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
            placeholder="XYZ Residences"
            value={property.propertyName || ""}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.propertyName && (
            <p className="text-red-500 text-sm">{errors.propertyName}</p>
          )}
        </div>

        {/* Address Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Street Address
          </label>
          <input
            type="text"
            name="street"
            value={property.street || ""}
            onChange={handleChange}
            placeholder="Enter street name"
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.street && (
            <p className="text-red-500 text-sm">{errors.street}</p>
          )}
        </div>

        {/* Other Address Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Barangay / District
          </label>
          <input
            type="number"
            name="brgyDistrict"
            value={property.brgyDistrict || ""}
            onChange={handleChange}
            placeholder="Enter barangay or district number"
            min={0}
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.brgyDistrict && (
            <p className="text-red-500 text-sm">{errors.brgyDistrict}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            City / Municipality
          </label>
          <input
            type="text"
            name="city"
            value={property.city || ""}
            onChange={handleChange}
            placeholder="Enter city"
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            ZIP Code
          </label>
          <input
            type="number"
            name="zipCode"
            value={property.zipCode || ""}
            onChange={handleChange}
            placeholder="Enter zip code"
            min={0}
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.zipCode && (
            <p className="text-red-500 text-sm">{errors.zipCode}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Province
          </label>
          <input
            type="text"
            name="province"
            value={property.province || ""}
            placeholder="Enter province"
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.province && (
            <p className="text-red-500 text-sm">{errors.province}</p>
          )}
        </div>
      </form>
    </div>
  );
};

export function StepTwo() {
  // Access state and actions from Zustand store
  const { property, setProperty } = usePropertyStore();

  // Function to handle amenity changes and update Zustand store
  const handleAmenityChange = (amenity) => {
    const currentAmenities = property.amenities || [];
    const amenityIndex = currentAmenities.indexOf(amenity);
    let newAmenities;

    if (amenityIndex > -1) {
      newAmenities = [
        ...currentAmenities.slice(0, amenityIndex),
        ...currentAmenities.slice(amenityIndex + 1),
      ];
    } else {
      newAmenities = [...currentAmenities, amenity];
    }

    setProperty({ amenities: newAmenities });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">
        Tell renters what your place offers
      </h2>
      <p className="text-gray-600 mb-6">
        Select the amenities available in your place.
      </p>

      {/* Amenities Section */}
      <div className="mb-8">
        <AmenitiesSelector
          selectedAmenities={property.amenities || []}
          onAmenityChange={handleAmenityChange}
        />
      </div>
    </div>
  );
}

export function StepThree() {
  // Access the property data and actions from Zustand store
  const { property, photos, setProperty, setPhotos } = usePropertyStore();

  // Handle file drop
  const onDrop = (acceptedFiles) => {
    const newPhotos = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    console.log("From step counter: ", newPhotos);
    setPhotos([...photos, ...newPhotos]); // Add new photos to the existing ones
    console.log("Current photos state:", [...photos, ...newPhotos]); // Add this line
  };

  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: true,
  });

  // Remove image from preview
  const removeImage = (index) => {
    setPhotos(photos.filter((_, i) => i !== index)); // Filter out the photo at the given index
  };

  return (
    <div className="space-y-8">
      {/* Photo Upload */}
      <div className="p-6 border rounded-md shadow-md">
        <h2 className="text-2xl font-bold mb-2">
          Add some photos of your place
        </h2>
        <p className="text-gray-500 mb-4">
          You’ll need 5 photos to get started. You can make changes later.
        </p>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-6 rounded-md text-center ${
            isDragActive ? "border-blue-500" : "border-gray-300"
          } cursor-pointer`}
        >
          <input {...getInputProps()} />
          <FaImage className="text-blue-500 text-4xl mx-auto mb-2" />
          <p className="font-medium text-gray-700">Drag your photos here</p>
        </div>

        {/* Preview uploaded images */}
        {photos?.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photos.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={file.preview}
                  alt="preview"
                  className="w-full h-32 object-cover rounded-md"
                />
                <span
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs cursor-pointer"
                  onClick={() => removeImage(index)}
                >
                  X
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StepFour() {
  // Access the property data and actions from Zustand store
  const {
    setMayorPermit,
    setOccPermit,
    setIndoorPhoto,
    setOutdoorPhoto,
    indoorPhoto,
    outdoorPhoto,
    occPermit,
    mayorPermit,
  } = usePropertyStore();
  // State to control the camera
  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState(""); // "indoor" or "outdoor"

  // Local states for file previews
  const [indoorPreview, setIndoorPreview] = useState(null);
  const [outdoorPreview, setOutdoorPreview] = useState(null);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  useEffect(() => {
    if (indoorPhoto) {
      // Create a local URL for the indoor photo if it exists in Zustand
      setIndoorPreview(URL.createObjectURL(indoorPhoto));
    }
  }, [indoorPhoto]); // Run when indoorPhoto changes

  useEffect(() => {
    if (outdoorPhoto) {
      // Create a local URL for the outdoor photo if it exists in Zustand
      setOutdoorPreview(URL.createObjectURL(outdoorPhoto));
    }
  }, [outdoorPhoto]); // Run when outdoorPhoto changes

  // Open camera for a specific type of photo
  const handleOpenCamera = (type) => {
    setPhotoType(type);
    setShowCamera(true);
  };

  // Handle image capture
  const handleCapture = (image) => {
    if (photoType === "indoor") {
      fetch(image)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "indoor.jpg", { type: "image/jpeg" });
          setIndoorPhoto(file);
          // setIndoorPreview(image); // Update indoor preview
        });
    } else {
      fetch(image)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "outdoor.jpg", { type: "image/jpeg" });
          setOutdoorPhoto(file);
          // setOutdoorPreview(image); // Update outdoor preview
        });
    }
    setShowCamera(false);
  };

  const validateFile = (file, setFile) => {
    if (!file) return true;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(
        `File size exceeds ${MAX_FILE_SIZE_MB}MB. Please upload a smaller file.`
      );
      setFile(null); // Clear the file
      return false;
    }
    return true;
  };

  const handleMayorPermitChange = (file) => {
    if (validateFile(file?.file, setMayorPermit)) {
      setMayorPermit(file);
      console.log(file);
    }
  };

  const handleOccPermitChange = (file) => {
    if (validateFile(file?.file, setOccPermit)) {
      setOccPermit(file);
      console.log(file);
    }
  };

  return (
    <div>
      {/* Requirements Section */}
      <h2 className="text-2xl font-bold mb-4">Add Requirements</h2>
      <ol className="text-gray-500 mb-6 list-decimal list-inside">
        <li>Please upload an occupancy permit in PDF format.</li>
        <li>
          Please upload a business or mayor's permit of the property in PDF
          format..
        </li>
      </ol>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mayor's Permit Upload */}
        <DropzoneUploader
          label="Business or Mayor's Permit (PDF)"
          file={mayorPermit}
          setFile={handleMayorPermitChange}
          accept="application/pdf"
          multiple={false}
        />

        {/* Occupancy Permit Upload */}
        <DropzoneUploader
          label="Occupancy Permit (PDF)"
          file={occPermit}
          setFile={handleOccPermitChange}
          accept="application/pdf"
          multiple={false}
        />
      </div>

      <hr className="my-8" />

      {/* Property Verification Section */}
      <h2 className="text-2xl font-bold mb-4">Property Verification</h2>
      <p className="text-gray-500 mb-4">
        Please take two photos of the property (inside and outside). This will
        be used for verification purposes only.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => handleOpenCamera("indoor")}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Capture Indoor
        </button>
        <button
          onClick={() => handleOpenCamera("outdoor")}
          className="bg-green-500 text-white px-4 py-2 rounded-md"
        >
          Capture Outdoor
        </button>
      </div>
      {showCamera && <Camera onCapture={handleCapture} />}

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Indoor Photos</h3>
        {indoorPreview && (
          <img
            src={indoorPreview}
            alt="Indoor Preview"
            className="w-24 h-24 object-cover rounded-md"
          />
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Outdoor Photos</h3>
        {outdoorPreview && (
          <img
            src={outdoorPreview}
            alt="Outdoor Preview"
            className="w-24 h-24 object-cover rounded-md"
          />
        )}
      </div>
    </div>
  );
}
