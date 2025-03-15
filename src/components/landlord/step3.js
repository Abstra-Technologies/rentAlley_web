import usePropertyStore from "../../zustand/propertyStore";
import { FaImage } from "react-icons/fa"; // Import checkmark icon from react-icons
import { useDropzone } from "react-dropzone";
import { UTILITY_BILLING_TYPES } from "../../constant/utilityBillingType";
import { PAYMENT_FREQUENCIES } from "../../constant/paymentFrequency";
import { FaInfoCircle } from "react-icons/fa";
import { useState } from "react";

export function StepThree() {
  const { property, photos, setProperty, setPhotos } = usePropertyStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onDrop = (acceptedFiles) => {
    const newPhotos = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    console.log("From step counter: ", newPhotos);
    setPhotos([...photos, ...newPhotos]);
    console.log("Current photos state:", [...photos, ...newPhotos]);
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

    if (name === "propDesc") {
      const paragraphCount = value
        .split("\n")
        .filter((p) => p.trim() !== "").length;
      if (paragraphCount > 3) {
        return;
      }
    }

    setProperty({ ...property, [name]: newValue });
  };

  const removeImage = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <div className="p-6 border rounded-md shadow-md">
        <h2 className="text-2xl font-bold mb-2">Add a property details</h2>
        <p className="text-gray-500 mb-4">
          You can always change your property details later.
        </p>
        <div className="space-y-4">
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg shadow-md">
            <p className="font-medium">
              If the property is rented as a whole, then the unit count is 1 by
              default.
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Total Units
            </label>
            <input
              type="number"
              name="totalUnits"
              value={property.totalUnits || ""}
              onChange={handleChange}
              placeholder="2"
              min="1"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Description (Max 3 paragraphs)
            </label>
            <textarea
              name="propDesc"
              value={property.propDesc || ""}
              onChange={handleChange}
              placeholder="Add a brief description of the property"
              className="w-full p-2 border rounded"
            ></textarea>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex-grow">
              <label className="block text-gray-700 font-medium mb-1">
                Floor Area
              </label>
              <input
                type="number"
                name="floorArea"
                value={property.floorArea || ""}
                onChange={handleChange}
                placeholder="e.g., 50"
                min={0}
                className="w-full p-2 border rounded"
              />
            </div>
            <span className="text-gray-500">sqm</span>
          </div>

          <div className="space-y-2">
            <label className="block text-gray-700 font-medium mb-1">
              Property Preferences
            </label>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="petFriendly"
                checked={property.petFriendly === 1}
                onChange={handleChange}
                className="h-6 w-6"
              />
              <label className="text-gray-700">Pet-Friendly</label>
            </div>

            <div>
              <label className="text-gray-700 font-medium flex items-center space-x-2 mt-4">
                <span>Utility Billing Type</span>
                <FaInfoCircle
                  className="text-blue-600 text-lg cursor-pointer"
                  onClick={() => setIsModalOpen(true)}
                />
              </label>
              <select
                name="utilityBillingType"
                value={property.utilityBillingType || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="" disabled>
                  Select a billing type
                </option>
                {UTILITY_BILLING_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-4 mb-4">
            Add Payment Term Details
          </h2>
          <p className="text-gray-500 mb-6">
            You can always change your payment term details later.
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="secDeposit"
                className="block text-sm font-medium text-gray-700"
              >
                Security Deposit (Amount)
              </label>
              <input
                id="secDeposit"
                type="number"
                placeholder="1000"
                min={0}
                className="mt-1 block w-full rounded-md border p-3"
                value={property.secDeposit || ""}
                onChange={(e) =>
                  setProperty({ ...property, secDeposit: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="advancedPayment"
                className="block text-sm font-medium text-gray-700"
              >
                Advanced Payment (Amount)
              </label>
              <input
                type="number"
                id="advancedPayment"
                min="0"
                value={property.advancedPayment || ""}
                placeholder="1000"
                onChange={(e) =>
                  setProperty({
                    ...property,
                    advancedPayment: Number(e.target.value),
                  })
                }
                className="mt-1 block w-full rounded-md border p-3"
              />
            </div>

            <div>
              <label
                htmlFor="minStay"
                className="block text-sm font-medium text-gray-700"
              >
                Minimum Stay (Months)
              </label>
              <input
                type="number"
                id="minStay"
                min={0}
                placeholder="5"
                value={property.minStay || ""}
                onChange={(e) =>
                  setProperty({
                    ...property,
                    minStay: Number(e.target.value),
                  })
                }
                className="mt-1 block w-full rounded-md border p-3"
              />
            </div>

            <div>
              <label
                htmlFor="lateFee"
                className="block text-sm font-medium text-gray-700"
              >
                Late Fee (%)
              </label>
              <input
                id="lateFee"
                type="number"
                placeholder="5"
                min={0}
                className="mt-1 block w-full rounded-md border p-3"
                value={property.lateFee || ""}
                onChange={(e) =>
                  setProperty({ ...property, lateFee: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="assocDues"
                className="block text-sm font-medium text-gray-700"
              >
                Association Dues
              </label>
              <input
                id="assocDues"
                type="number"
                placeholder="0"
                min={0}
                className="mt-1 block w-full rounded-md border p-3"
                value={property.assocDues || ""}
                onChange={(e) =>
                  setProperty({ ...property, assocDues: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="paymentFrequency"
                className="block text-sm font-medium text-gray-700"
              >
                Payment Frequency
              </label>
              <select
                id="paymentFrequency"
                name="paymentFrequency"
                value={property.paymentFrequency || ""}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border p-3"
              >
                <option value="" disabled>
                  Select Payment Frequency
                </option>
                {PAYMENT_FREQUENCIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
                  <h3 className="text-lg font-semibold mb-4">
                    Utility Billing Types
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>
                      <strong>Included:</strong> Rent amount covers electricity,
                      water, and utilities.
                    </li>
                    <li>
                      <strong>Provider:</strong> The rent does not cover
                      utilities. Tenants pay their utility providers directly
                      for electricity and water.
                    </li>
                    <li>
                      <strong>Submetered:</strong> Billed based on individual
                      usage.
                    </li>
                  </ul>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="mt-4 w-full bg-blue-500 text-white p-2 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 border rounded-md shadow-md">
        <h2 className="text-2xl font-bold mb-2">
          Add some photos of your place
        </h2>
        <p className="text-gray-500 mb-4">
          You’ll need 3 photos to get started. You can make changes later.
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
