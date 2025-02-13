"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";

const EditUnit = () => {
  const router = useRouter();
  const { unitId } = useParams();

  const [unit, setUnit] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [furnishOptions, setFurnishOptions] = useState([]);
  const [formData, setFormData] = useState({
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
    furnish: false,
    status: "unoccupied",
  });
  const [newPhotos, setNewPhotos] = useState([]);

  useEffect(() => {
    if (!unitId) return;

    async function fetchData() {
      try {
        // Fetch unit details
        const { data } = await axios.get(
          `/api/unitListing/unit?unit_id=${unitId}`
        );

        if (data.length > 0) {
          const unitData = data[0]; // Get the first object from the array

          setUnit(unitData);
          setFormData({
            unitName: unitData.unit_name || "",
            description: unitData.description || "",
            floorArea: unitData.floor_area || "",
            petFriendly: Boolean(unitData.pet_friendly),
            bedSpacing: unitData.bed_spacing || "",
            availBeds: unitData.avail_beds || "",
            rentPayment: unitData.rent_payment || "",
            minStay: unitData.min_stay || "",
            lateFee: unitData.late_fee || "",
            secDeposit: unitData.sec_deposit || "",
            advancedPayment: unitData.advanced_payment || "",
            hasElectricity: Boolean(unitData.has_electricity),
            hasWater: Boolean(unitData.has_water),
            hasAssocdues: Boolean(unitData.has_assocdues),
            furnish: unitData.furnish || "unfurnished",
          });
        } else {
          console.warn("No unit found for the given unit ID.");
        }

        // Fetch unit photos
        const { data: photoData } = await axios.get(
          `/api/unitListing/unitPhoto?unit_id=${unitId}`
        );
        setPhotos(photoData);
      } catch (error) {
        console.error("Error fetching unit:", error);
      }
    }

    fetchData();
  }, [unitId]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle new photo selection
  const handleFileChange = (e) => {
    setNewPhotos(e.target.files);
  };

  // Update Unit Details
  const handleUpdateUnit = async (e) => {
    const viewUnitURL = `/pages/landlord/property-listing/view-unit/${unit.property_id}`;
    e.preventDefault();
    try {
      await axios.put(`/api/unitListing/unit?id=${unitId}`, formData);
      alert("Unit updated successfully");
      router.push(viewUnitURL); // Redirect after update
    } catch (error) {
      console.error("Error updating unit:", error);
      alert("Failed to update unit");
    }
  };

  // Upload new photos
  const handleUploadPhotos = async () => {
    if (newPhotos.length === 0) return alert("No new photos selected");

    const formData = new FormData();
    formData.append("unit_id", unitId);
    for (let file of newPhotos) {
      formData.append("files", file);
    }

    try {
      await axios.post(`/api/unitListing/unitPhoto`, formData);
      alert("Photos uploaded successfully");
      router.refresh(); // Reload page to show new photos
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("Failed to upload photos");
    }
  };

  useEffect(() => {
    async function fetchFurnishOptions() {
      try {
        const response = await axios.get("/api/unitListing/furnishOptions");
        setFurnishOptions(response.data.furnishOptions);
      } catch (error) {
        console.error("Error fetching furnish options:", error);
      }
    }

    fetchFurnishOptions();
  }, []);

  // Delete a photo
  const handleDeletePhoto = async (photoId) => {
    try {
      await axios.delete(`/api/unitListing/unitPhoto?id=${photoId}`);
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo");
    }
  };

  if (!unit) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Edit Unit</h2>

      <form onSubmit={handleUpdateUnit} className="space-y-4">
        {/* Unit Details Form */}
        <div>
          <label
            htmlFor="unitName"
            className="block text-gray-700 text-sm mb-2"
          >
            Unit Name:
          </label>
          <input
            type="text"
            id="unitName"
            name="unitName"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.unitName}
            onChange={handleChange}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-gray-700 text-sm mb-2"
          >
            Description:
          </label>
          <textarea
            id="description"
            name="description"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <label
            htmlFor="floorArea"
            className="block text-gray-700 text-sm mb-2"
          >
            Floor Area:
          </label>
          <input
            type="number"
            id="floorArea"
            name="floorArea"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.floorArea}
            onChange={handleChange}
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
                id="availBeds"
                name="availBeds"
                value={formData.availBeds || ""}
                onChange={handleChange}
                placeholder="Enter available bed spacing"
                className="w-full p-2 border rounded"
              />
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="rentPayment"
            className="block text-gray-700 text-sm mb-2"
          >
            Rent Payment:
          </label>
          <input
            type="number"
            id="rentPayment"
            name="rentPayment"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.rentPayment}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="minStay" className="block text-gray-700 text-sm mb-2">
            Minimum Stay:
          </label>
          <input
            type="number"
            id="minStay"
            name="minStay"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.minStay}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="lateFee" className="block text-gray-700 text-sm mb-2">
            Late Fee:
          </label>
          <input
            type="number"
            id="lateFee"
            name="lateFee"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.lateFee}
            onChange={handleChange}
          />
        </div>

        <div>
          <label
            htmlFor="secDeposit"
            className="block text-gray-700 text-sm mb-2"
          >
            Security Deposit:
          </label>
          <input
            type="number"
            id="secDeposit"
            name="secDeposit"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.secDeposit}
            onChange={handleChange}
          />
        </div>

        <div>
          <label
            htmlFor="advancedPayment"
            className="block text-gray-700 text-sm mb-2"
          >
            Advanced Payment:
          </label>
          <input
            type="number"
            id="advancedPayment"
            name="advancedPayment"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.advancedPayment}
            onChange={handleChange}
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
            <span className="ml-3 text-lg text-gray-700">Association Dues</span>
          </label>
        </div>

        <div>
          <label className="block text-gray-700 text-sm mb-2">Furnish:</label>
          <select
            id="furnish"
            name="furnish"
            value={formData.furnish}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="" disabled>
              Select Furnish Type
            </option>
            {furnishOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* React Dropzone */}
        {/* <div
          {...getRootProps()}
          className="dropzone border-2 border-dashed border-gray-400 rounded-md p-4 text-center cursor-pointer"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-gray-600">Drop the files here ...</p>
          ) : (
            <p className="text-gray-600">
              Drag 'n' drop some files here, or click to select files
            </p>
          )}
        </div> */}

        {/* Display Photos */}
        {/* {photos && photos.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Unit Photos
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.photo_url}
                    alt={`Unit Photo ${photo.id}`}
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )} */}

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Update Unit
        </button>

        <hr className="my-6" />

        <h3 className="text-xl font-bold mb-2">Unit Photos</h3>
        <div className="flex gap-2 flex-wrap">
          {photos.map((photo) => (
            <div key={photo.id} className="relative">
              <img
                src={photo.photo_url}
                alt="Unit"
                className="w-40 h-40 object-cover"
              />
              <button
                onClick={() => handleDeletePhoto(photo.id)}
                className="absolute top-0 right-0 bg-red-500 text-white p-1"
              >
                X
              </button>
            </div>
          ))}
        </div>

        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="border p-2 w-full mt-4"
        />
        <button
          onClick={handleUploadPhotos}
          className="bg-green-500 text-white p-2 mt-2"
        >
          Upload New Photos
        </button>
      </form>
    </div>
  );
};

export default EditUnit;
