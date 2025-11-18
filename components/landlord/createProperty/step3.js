import usePropertyStore from "@/zustand/property/usePropertyStore";
import { FaImage } from "react-icons/fa";
import { useDropzone } from "react-dropzone";
import { UTILITY_BILLING_TYPES } from "@/constant/utilityBillingType";
import { PAYMENT_FREQUENCIES } from "@/constant/paymentFrequency";
import { FaInfoCircle } from "react-icons/fa";
import { useState } from "react";
import { PROPERTY_PREFERENCES } from "@/constant/propertyPreferences";

export function StepThree() {
  const { property, photos, setProperty, setPhotos } = usePropertyStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onDrop = (acceptedFiles) => {
    const newPhotos = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos([...photos, ...newPhotos]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: true,
  });

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    let newValue = type === "checkbox" ? (checked ? 1 : 0) : value;

    if (name === "totalUnits") {
      if (value === "") {
        newValue = "";
      } else if (Number(value) === 0) {
        newValue = 1;
      } else {
        newValue = Number(value);
      }
    }

    setProperty({ ...property, [name]: newValue });
  };

  const removeImage = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleGenerateDescription = async () => {
    setLoading(true);
    const {
      propertyName,
      propertyType,
      amenities,
      street,
      brgyDistrict,
      city,
      zipCode,
      province,
    } = property;

    const prompt = `Generate a compelling property description for a listing with the following details:
- Name: ${propertyName}
- Type: ${propertyType}
- Amenities: ${amenities?.join(", ") || "None"}
- Location: ${street}, ${brgyDistrict}, ${city}, ${zipCode}, ${province}`;

    try {
      const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "deepseek/deepseek-r1:free",
              messages: [
                {
                  role: "system",
                  content: "You are a helpful real estate assistant.",
                },
                { role: "user", content: prompt },
              ],
            }),
          }
      );

      const data = await response.json();
      const aiText = data?.choices?.[0]?.message?.content?.trim();

      if (aiText) {
        setProperty({ propDesc: aiText });
      }
    } catch (error) {
      console.error("AI generation error:", error);
      alert("Failed to generate description. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key) => {
    const current = property.propertyPreferences || [];
    setProperty({
      ...property,
      propertyPreferences: current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          Add property details
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
          You can always change your property details later.
        </p>
      </div>

      {/* Property Details Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Description Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">
                  1
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Property Description
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-gray-700"
                  htmlFor="description"
                >
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="propDesc"
                  value={property.propDesc || ""}
                  onChange={handleChange}
                  placeholder="Add a brief description of the property that highlights its best features..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base resize-vertical"
                  rows={5}
                />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{(property.propDesc || "").length} characters</span>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={loading}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span>Generate with AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Property Size */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Total Property Size <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="floorArea"
                      value={property.floorArea || ""}
                      onChange={handleChange}
                      placeholder="50"
                      min={0}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-12 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                    />
                    <span className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                      sqm
                    </span>
                  </div>
                </div>

                {/* Minimum Stay */}
                <div className="space-y-2">
                  <label
                    htmlFor="minStay"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Minimum Stay (Months)
                  </label>
                  <input
                    type="number"
                    id="minStay"
                    min={0}
                    placeholder="6"
                    value={property.minStay || ""}
                    onChange={(e) =>
                      setProperty({
                        ...property,
                        minStay: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Property Preferences */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">
                  2
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Property Preferences & Rules
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {PROPERTY_PREFERENCES.map((pref) => {
                const Icon = pref.icon;
                const isSelected = (
                  property.propertyPreferences || []
                ).includes(pref.key);
                return (
                  <button
                    type="button"
                    key={pref.key}
                    onClick={() => togglePreference(pref.key)}
                    className={`flex flex-col items-center justify-center p-3 sm:p-4 border rounded-lg sm:rounded-xl shadow-sm text-xs sm:text-sm transition-all duration-200 ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-500 to-emerald-500 text-white border-blue-500 shadow-lg transform scale-105"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                    }`}
                  >
                    <Icon className="text-xl sm:text-2xl mb-1 sm:mb-2" />
                    <span className="font-medium text-center">
                      {pref.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Utility Billing */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs sm:text-sm">3</span>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Utility Billing
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Water Billing */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <span>Water Billing Type</span>
                  <FaInfoCircle
                      className="text-blue-600 text-base cursor-pointer hover:text-blue-700 transition-colors"
                      onClick={() => setIsModalOpen(true)}
                  />
                </label>
                <select
                    name="waterBillingType"
                    value={property.waterBillingType || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                >
                  <option value="" disabled>
                    Select water billing type
                  </option>
                  {UTILITY_BILLING_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                  ))}
                </select>
              </div>

              {/* Electricity Billing */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <span>Electricity Billing Type</span>
                  <FaInfoCircle
                      className="text-blue-600 text-base cursor-pointer hover:text-blue-700 transition-colors"
                      onClick={() => setIsModalOpen(true)}
                  />
                </label>
                <select
                    name="electricityBillingType"
                    value={property.electricityBillingType || ""}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base"
                >
                  <option value="" disabled>
                    Select electricity billing type
                  </option>
                  {UTILITY_BILLING_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ℹ️ Informational warning (always visible) */}
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 font-medium">
                ⚠️ Please choose carefully — utility billing types cannot be modified after property creation.
              </p>
              <p className="text-xs text-amber-600 mt-1 leading-relaxed">
                If you need to change this later, you must request assistance from a system administrator or delete the property and recreate it with the correct settings.
              </p>
            </div>

            {/* Utility Info Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                  <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">
                      Utility Billing Types
                    </h3>
                    <ul className="space-y-3 text-gray-700 text-sm">
                      <li className="flex items-start space-x-2">
            <span className="font-semibold text-blue-600 flex-shrink-0">
              Included:
            </span>
                        <span>Rent amount covers the utility cost.</span>
                      </li>
                      <li className="flex items-start space-x-2">
            <span className="font-semibold text-green-600 flex-shrink-0">
              Direct:
            </span>
                        <span>Tenant pays the utility provider directly.</span>
                      </li>
                      <li className="flex items-start space-x-2">
            <span className="font-semibold text-orange-600 flex-shrink-0">
              Submetered:
            </span>
                        <span>Tenant is billed based on actual usage.</span>
                      </li>
                    </ul>
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="mt-6 w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white p-3 rounded-lg font-semibold hover:from-blue-600 hover:to-emerald-600 transition-all duration-200"
                    >
                      Got it
                    </button>
                  </div>
                </div>
            )}
          </div>

        </div>
      </div>

      {/* Photos Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Property Photos <span className="text-red-500">*</span>
              </h3>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                You'll need at least <span className="font-semibold text-gray-800">3 photos</span> to get started.
                These images will be <span className="text-blue-700 font-medium"> visible to the public </span>
                on your property listing. You can always add or update photos later.
              </p>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-lg sm:rounded-xl p-6 sm:p-8 transition-all duration-300 cursor-pointer group ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-center space-y-3 sm:space-y-4">
                  <div
                    className={`mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      isDragActive
                        ? "bg-blue-100"
                        : "bg-gray-100 group-hover:bg-blue-50"
                    }`}
                  >
                    <FaImage
                      className={`text-2xl sm:text-4xl transition-colors duration-300 ${
                        isDragActive
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-blue-500"
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-base sm:text-lg font-medium transition-colors duration-300 ${
                        isDragActive ? "text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {isDragActive
                        ? "Drop photos here"
                        : "Drag your photos here"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Or click to browse and select multiple images
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Supported formats: JPG, PNG, GIF (Max 10MB each)
                    </p>
                  </div>
                </div>
              </div>

              {/* Photo Previews */}
              {photos?.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Uploaded Photos ({photos.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {photos.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={file.preview}
                            alt="Property preview"
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        </div>
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 hover:bg-red-600 text-white p-1 sm:p-1.5 rounded-full text-xs transition-colors duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
                          onClick={() => removeImage(index)}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
