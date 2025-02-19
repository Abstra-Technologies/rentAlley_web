"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FiUploadCloud } from "react-icons/fi"; // Import the React Icon
import axios from "axios";
import useAuth from "../../../../../hooks/useSession";

const TenantApplicationForm = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    property_id: "",
    address: "", // address still used for display, but will be submitted as part of submit-reqs API
  });

  // Ensure user is loaded before accessing properties
  if (!user) {
    return <div>Loading...</div>; // Show loading or fallback UI
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]; // Get only the first file
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDropboxClick = () => {
    fileInputRef.current.click(); // Trigger file input on dropbox click
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    // Show confirmation alert
    const confirmSubmission = window.confirm(
      "Are you sure you want to proceed?"
    );
    if (!confirmSubmission) return; // Stop if user cancels

    // 1. Submit Tenant Information
    try {
      const infoPayload = {
        property_id: formData.property_id,
        tenant_id: user.tenant_id, // Use user.tenant_id
        unit_id: "", // You can set these defaults as needed.
        current_home_address: formData.address,
      };

      const infoResponse = await axios.post(
        "/api/tenant/prospective/submit-info",
        infoPayload
      );

      if (infoResponse.status === 201) {
        console.log("✅ Tenant info saved successfully!");

        // 2. Submit Requirements (File)
        if (selectedFile) {
          const fileFormData = new FormData();
          fileFormData.append("file", selectedFile);
          // Append property_id, tenant_id, current_home_address to fileFormData
          fileFormData.append("property_id", formData.property_id);
          fileFormData.append("tenant_id", user.tenant_id);
          fileFormData.append("current_home_address", formData.address);

          try {
            const reqResponse = await axios.put(
              "/api/tenant/prospective/submit-reqs",
              fileFormData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            if (reqResponse.status === 201) {
              console.log("✅ Requirements submitted successfully!");
            } else {
              console.error(
                "❌ Failed to submit requirements:",
                reqResponse.data
              );
              alert(
                `Submission failed: ${
                  reqResponse.data.message || "Unknown error"
                }`
              );
            }
          } catch (reqError) {
            console.error("❌ Error submitting requirements:", reqError);
            alert(`Submission failed: ${reqError.message || "Network error"}`);
          }
        } else {
          console.warn("⚠️ No file selected, skipping file upload.");
          alert("Tenant information saved, but no file was uploaded.");
        }
        alert("Submission successful!");
        router.push("/pages/find-rent");
      } else {
        console.error(
          "❌ Failed to save tenant info:",
          infoResponse.data || infoResponse.status
        );
        alert(
          `Submission failed: ${
            infoResponse.data?.message || "Failed to save tenant info."
          }`
        );
      }
    } catch (infoError) {
      console.error("❌ Error saving tenant info:", infoError);
      alert(`Submission failed: ${infoError.message || "Network error"}`);
    }
  };

  const handleCancel = () => {
    router.push("/pages/find-rent"); // Redirect on cancel
  };

  return (
    <div className="bg-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
          Tenant Application Form
        </h1>

        {/* Steps to Follow */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Steps to follow:
          </h2>
          <ol className="list-decimal list-inside text-gray-500">
            <li>Submit your valid I.D. to the dropbox below</li>
          </ol>
        </div>

        {/* Dropbox Section */}
        <div className="mb-6">
          <h3 className="text-sm text-gray-500 mb-1">Dropbox Below:</h3>
          <p className="text-xs text-gray-500 mb-2">
            Submit all requirements below. Thank you!
          </p>

          <div
            className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer"
            onClick={handleDropboxClick}
          >
            <FiUploadCloud className="w-12 h-12 text-gray-400 mb-2" />

            <p className="text-sm text-gray-700 font-medium">
              Drag & drop files or <span className="text-blue-500">Browse</span>
            </p>
            <p className="text-xs text-gray-500">
              Supported formats: JPEG and PNG
            </p>

            {/* Hidden File Input */}
            <input
              type="file"
              accept="image/jpeg, image/png"
              className="hidden"
              onChange={handleFileSelect}
              ref={fileInputRef}
            />

            {selectedFile && (
              <p className="mt-2 text-sm text-gray-500">
                Selected file: {selectedFile.name}
              </p>
            )}
          </div>
        </div>

        {/* Application Form Section */}
        <form onSubmit={handleFormSubmit}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              2. Kindly fill up the application form.
            </h2>

            {/* First Name */}
            <div className="mb-4">
              <label
                htmlFor="firstName"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                FIRST NAME
              </label>
              <input
                type="text"
                id="firstName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                value={user.firstName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                disabled
              />
            </div>

            {/* Last Name */}
            <div className="mb-4">
              <label
                htmlFor="lastName"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                LAST NAME
              </label>
              <input
                type="text"
                id="lastName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                value={user.lastName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                disabled
              />
            </div>

            {/* Date of Birth */}
            <div className="mb-4">
              <label
                htmlFor="birthDate"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                DATE OF BIRTH (MM/DD/YYYY)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={user.birthDate ? user.birthDate.substring(5, 7) : ""}
                  className="shadow appearance-none border rounded w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                  disabled
                />
                <input
                  type="text"
                  value={user.birthDate ? user.birthDate.substring(8, 10) : ""}
                  className="shadow appearance-none border rounded w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                  disabled
                />
                <input
                  type="text"
                  value={user.birthDate ? user.birthDate.substring(0, 4) : ""}
                  className="shadow appearance-none border rounded w-1/2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                  disabled
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                value={user.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled
              />
            </div>

            {/* Mobile Number */}
            <div className="mb-4">
              <label
                htmlFor="mobile"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                MOBILE NUMBER
              </label>
              <input
                type="tel"
                id="phoneNumber"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                value={user.phoneNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                disabled
              />
            </div>

            {/* Address */}
            <div className="mb-4">
              <label
                htmlFor="address"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                ADDRESS
              </label>
              <input
                type="text"
                id="address"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            {/* Property ID */}
            <div className="mb-4">
              <label
                htmlFor="property_id"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                PROPERTY ID
              </label>
              <input
                type="text"
                id="property_id"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={formData.property_id}
                onChange={(e) =>
                  setFormData({ ...formData, property_id: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-transparent hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 border border-gray-500 hover:border-transparent rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantApplicationForm;
