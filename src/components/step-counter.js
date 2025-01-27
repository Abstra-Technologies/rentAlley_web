import React, { useState } from "react";
import { FaCheck, FaWifi, FaTv, FaUtensils, FaSnowflake, FaShower, FaImage, FaCloudUploadAlt } from "react-icons/fa"; // Import checkmark icon from react-icons
import { PiWashingMachine } from "react-icons/pi";
import { GiPoolTableCorner } from "react-icons/gi";
import { MdPool, MdFitnessCenter, MdDirectionsCar, MdSchool } from "react-icons/md";
import { useDropzone } from "react-dropzone";

const steps = [
  { id: 1, label: "Location" },
  { id: 2, label: "Amenities/Features" },
  { id: 3, label: "Property Details" },
  { id: 4, label: "Payment Terms & Requirements" },
];

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

// Steps as individual components
export const StepOne = ({ formData, handleChange }) => (
  <div>
    <h1 className="mt-5 text-3xl font-bold mb-6">List New Property Unit</h1>
      <p className="text-gray-600 mb-4">
        List it in the market where renters are waiting!
      </p>
      <div>
          <label className="block text-sm font-medium text-gray-700">
            Building Name (Default)
          </label>
          <input
            type="text"
            value="XYZ Residences"
            readOnly
            className="mt-1 block w-full rounded-md bg-gray-200 text-gray-700 border-gray-300 shadow-sm py-2 px-4"
          />
        </div>
        <div>
        <label className=" mt-3 block text-sm font-medium text-gray-700">
        Unit, Level, etc. </label>
        <input
      type="text"
      name="propertyName"
      placeholder="Property Name"
      onChange={handleChange}
      value={formData.propertyName || ""}
      className="w-full p-2 border rounded mb-4"
    /></div>
    
  </div>
);

export function StepTwo ({ formData, setFormData }) {
  const [selectedFeatures, setSelectedFeatures] = useState(formData.features || []);
  const [selectedAmenities, setSelectedAmenities] = useState(formData.amenities || []);

  const features = [
    { name: "Wifi", icon: <FaWifi /> },
    { name: "TV", icon: <FaTv /> },
    { name: "Kitchen", icon: <FaUtensils /> },
    { name: "Washer", icon: <PiWashingMachine /> },
    { name: "Air Conditioning", icon: <FaSnowflake /> },
    { name: "Shower Heater", icon: <FaShower /> },
  ];

  const amenities = [
    { name: "Pool", icon: <MdPool /> },
    { name: "Gym", icon: <MdFitnessCenter /> },
    { name: "Pool Tables", icon: <GiPoolTableCorner /> },
    { name: "Study Hub", icon: <MdSchool /> },
    { name: "Car Parking", icon: <MdDirectionsCar /> },
  ];

  const toggleSelection = (item, type) => {
    if (type === "features") {
      const updatedFeatures = selectedFeatures.includes(item)
        ? selectedFeatures.filter((feature) => feature !== item)
        : [...selectedFeatures, item];
      setSelectedFeatures(updatedFeatures);
      setFormData({ ...formData, features: updatedFeatures });
    } else {
      const updatedAmenities = selectedAmenities.includes(item)
        ? selectedAmenities.filter((amenity) => amenity !== item)
        : [...selectedAmenities, item];
      setSelectedAmenities(updatedAmenities);
      setFormData({ ...formData, amenities: updatedAmenities });
    }
  };

  const isSelected = (item, type) =>
    type === "features" ? selectedFeatures.includes(item) : selectedAmenities.includes(item);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Tell renters what your place has to offer</h2>
      <p className="text-gray-600 mb-6">Add what your place has to offer!</p>

      {/* Features Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Add available features</h3>
        <div className="grid grid-cols-3 gap-4">
          {features.map((feature) => (
            <button
              key={feature.name}
              onClick={() => toggleSelection(feature.name, "features")}
              className={`flex items-center justify-center gap-2 p-4 border rounded-lg ${
                isSelected(feature.name, "features") ? "bg-blue-500 text-white" : "bg-white"
              }`}
            >
              <div className="text-2xl">{feature.icon}</div>
              <span>{feature.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amenities Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Add available amenities</h3>
        <div className="grid grid-cols-3 gap-4">
          {amenities.map((amenity) => (
            <button
              key={amenity.name}
              onClick={() => toggleSelection(amenity.name, "amenities")}
              className={`flex items-center justify-center gap-2 p-4 border rounded-lg ${
                isSelected(amenity.name, "amenities") ? "bg-blue-500 text-white" : "bg-white"
              }`}
            >
              <div className="text-2xl">{amenity.icon}</div>
              <span>{amenity.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StepThree({ formData, setFormData }) {
  const furnishOptions = [
    { id: 1, name: "Furnished" },
    { id: 2, name: "Semi-Furnished" },
    { id: 3, name: "Unfurnished" },
  ];

  const onDrop = (acceptedFiles) => {
    setFormData({
      ...formData,
      photos: acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      ),
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] }, // Accept only image files
    multiple: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="space-y-8">
      {/* Property Unit Details Box */}
      <div className="p-6 border rounded-md shadow-md">
        <h2 className="text-2xl font-bold mb-2">Add a property unit details</h2>
        <p className="text-gray-500 mb-4">
          You can always change your property unit details later.
        </p>

        <div className="space-y-4">
          {/* Unit Name */}
          <div>
            <label htmlFor="unitName" className="block text-gray-700 font-medium mb-1">
              Unit Name
            </label>
            <input
              type="text"
              id="unitName"
              name="unitName"
              value={formData.unitName || ""}
              onChange={handleChange}
              placeholder="e.g., XYZ Residence - Unit 103"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-gray-700 font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Add a brief description of the unit"
              className="w-full p-2 border rounded"
            ></textarea>
          </div>

          {/* Floor Area */}
          <div className="flex items-center space-x-2">
            <div className="flex-grow">
              <label htmlFor="floorArea" className="block text-gray-700 font-medium mb-1">
                Floor Area
              </label>
              <input
                type="number"
                id="floorArea"
                name="floorArea"
                value={formData.floorArea || ""}
                onChange={handleChange}
                placeholder="e.g., 50"
                className="w-full p-2 border rounded"
              />
            </div>
            <span className="text-gray-500">sqm</span>
          </div>

          {/* Furnishing Dropdown */}
        <div>
          <label htmlFor="furnishing" className="block text-gray-700 font-medium mb-1">
            Furnishing
          </label>
          <select
            id="furnishing"
            name="furnishing"
            value={formData.furnishing || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            {/* Default option */}
            <option value="furnishing">Select Furnishing</option>

            {/* Dynamically render options from furnishOptions */}
            {furnishOptions.map((option) => (
              <option key={option.id} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

          {/* Checkboxes */}
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium mb-1">Additional Features</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="petFriendly"
                name="petFriendly"
                checked={formData.petFriendly || false}
                onChange={handleChange}
                className="h-6 w-6"
              />
              <label htmlFor="petFriendly" className="text-gray-700">
                Pet-Friendly
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="bedSpacing"
                name="bedSpacing"
                checked={formData.bedSpacing || false}
                onChange={handleChange}
                className="h-6 w-6"
              />
              <label htmlFor="bedSpacing" className="text-gray-700">
                Bed Spacing (if applicable)
              </label>
            </div>
          </div>
        </div>
      </div>
      {/* Photo Upload Box */}
      <div className="p-6 border rounded-md shadow-md">
        <h2 className="text-2xl font-bold mb-2">Add some photos of your place</h2>
        <p className="text-gray-500 mb-4">
          You’ll need 5 photos to get started. You can make changes later.
        </p>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed p-6 rounded-md text-center ${
            isDragActive ? "border-blue-500" : "border-gray-300"
          }`}
        >
          <input {...getInputProps()} />
          <FaImage className="text-blue-500 text-4xl mx-auto mb-2" />
          <p className="font-medium text-gray-700">Drag your photos here</p>
          <p className="text-sm text-gray-500">
            Choose at least 5 photos or{" "}
            <span className="text-blue-500 underline cursor-pointer">
              Upload from your device
            </span>
          </p>
        </div>
        {/* Preview uploaded images */}
        {formData.photos && formData.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {formData.photos.map((file, index) => (
              <div key={index} className="relative">
                <img
                  src={file.preview}
                  alt="preview"
                  className="w-full h-32 object-cover rounded-md"
                />
                <span
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs cursor-pointer"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      photos: formData.photos.filter((_, i) => i !== index),
                    })
                  }
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

export function StepFour({ formData, setFormData }) {
  const handleFileUpload = (event, key) => {
    const files = Array.from(event.target.files);
    setFormData({
      ...formData,
      [key]: files,
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Add Payment Term Details</h2>
      <p className="text-gray-500 mb-6">
        You can always change your payment term details later.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Rent Payment
            </label>
            <input
              type="number"
              placeholder="1000"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg p-3"
              value={formData.rentPayment || ""}
              onChange={(e) =>
                setFormData({ ...formData, rentPayment: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Advanced Payment (Months)
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg p-3"
              value={formData.advancedPayment || ""}
              onChange={(e) =>
                setFormData({ ...formData, advancedPayment: e.target.value })
              }
            >
              {[...Array(12).keys()].map((month) => (
                <option key={month + 1} value={month + 1}>
                  {month + 1}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Security Deposit (Months)
            </label>
            <input
              type="number"
              placeholder="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg p-3"
              value={formData.securityDeposit || ""}
              onChange={(e) =>
                setFormData({ ...formData, securityDeposit: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Minimum Stay (Months)
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg p-3"
              value={formData.minimumStay || ""}
              onChange={(e) =>
                setFormData({ ...formData, minimumStay: e.target.value })
              }
            >
              {[...Array(12).keys()].map((month) => (
                <option key={month + 1} value={month + 1}>
                  {month + 1}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Late Fee (%)
            </label>
            <input
              type="number"
              placeholder="5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg p-3"
              value={formData.lateFee || ""}
              onChange={(e) =>
                setFormData({ ...formData, lateFee: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Utility Bill (Check if included)
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-6 w-6"
                checked={formData.waterBill || false}
                onChange={(e) =>
                  setFormData({ ...formData, waterBill: e.target.checked })
                }
              />
              <span className="ml-3 text-lg text-gray-700">Water Bill</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-6 w-6"
                checked={formData.electricityBill || false}
                onChange={(e) =>
                  setFormData({ ...formData, electricityBill: e.target.checked })
                }
              />
              <span className="ml-3 text-lg text-gray-700">Electricity Bill</span>
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-700">Others</label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-6 w-6"
              checked={formData.associationDues || false}
              onChange={(e) =>
                setFormData({ ...formData, associationDues: e.target.checked })
              }
            />
            <span className="ml-3 text-lg text-gray-700">Association Dues</span>
          </label>
        </div>
      </div>

      <hr className="my-8" />

      <h2 className="text-2xl font-bold mb-4">Add Requirements</h2>
      <p className="text-gray-500 mb-6">
        1. Please upload valid I.D. and land title of the property unit. <br />
        2. Please upload mayor's permit of the property unit.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Government I.D.
          </label>
          <div className="border-2 border-dashed p-6 rounded-md text-center">
            <FaCloudUploadAlt className="text-blue-500 text-4xl mx-auto mb-2" />
            <input
              type="file"
              accept="image/jpeg, image/png"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "governmentID")}
            />
            <p className="font-medium text-lg text-gray-700">
              Drag & drop files or Browse
            </p>
            <p className="text-sm text-gray-500">Supported formats: JPEG and PNG</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Business or Mayor's Permit
          </label>
          <div className="border-2 border-dashed p-6 rounded-md text-center">
            <FaCloudUploadAlt className="text-blue-500 text-4xl mx-auto mb-2" />
            <input
              type="file"
              accept="image/jpeg, image/png"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "mayorsPermit")}
            />
            <p className="font-medium text-lg text-gray-700">
              Drag & drop files or Browse
            </p>
            <p className="text-sm text-gray-500">Supported formats: JPEG and PNG</p>
          </div>
        </div>
      </div>
    </div>
  );
}
