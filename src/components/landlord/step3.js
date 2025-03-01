import usePropertyStore from "../../zustand/propertyStore";
import { FaImage } from "react-icons/fa"; // Import checkmark icon from react-icons
import { useDropzone } from "react-dropzone";
import { UTILITY_BILLING_TYPES } from "../../constant/utilityBillingType";
import { PAYMENT_FREQUENCIES } from "../../constant/paymentFrequency";

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

  // Handle input changes for property details
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    let newValue = type === "checkbox" ? (checked ? 1 : 0) : value;

    if (name === "multipleUnits") {
      newValue = checked ? 1 : 0;
      setProperty({
        ...property,
        multipleUnits: newValue,
        totalUnits: checked ? property.totalUnits || "" : 1,
      });
      return;
    }

    setProperty({ ...property, [name]: newValue });
  };

  // Remove image from preview
  const removeImage = (index) => {
    setPhotos(photos.filter((_, i) => i !== index)); // Filter out the photo at the given index
  };

  return (
    <div className="space-y-8">
      {/* Property Details */}
      <div className="p-6 border rounded-md shadow-md">
        <h2 className="text-2xl font-bold mb-2">Add a property details</h2>
        <p className="text-gray-500 mb-4">
          You can always change your property details later.
        </p>
        <div className="space-y-4">
          {/* Number of Units */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="multipleUnits"
                checked={property.multipleUnits === 1}
                onChange={handleChange}
                className="h-5 w-5"
              />
              <span className="text-gray-700 font-medium">
                Do you have one or more units?
              </span>
            </label>
          </div>

          {/* Show total units input only if multiple units checkbox is checked */}
          {property.multipleUnits === 1 && (
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
          )}

          {/* Conditionally show when numberOfUnit is 0 */}
          {property.multipleUnits === 1 ? (
            <div className="bg-yellow-100 text-yellow-700 p-4 rounded-md shadow-md">
              <p className="font-medium">
                Since you have more than one or more units, individual property
                details are not required. You&#39;ll manage details per unit
                later.
              </p>
            </div>
          ) : (
            <>
              {/* Property Description */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="propDesc"
                  value={property.propDesc || ""}
                  onChange={handleChange}
                  placeholder="Add a brief description of the property"
                  className="w-full p-2 border rounded"
                ></textarea>
              </div>

              {/* Floor Area */}
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

              {/* Additional Features Checkboxes */}
              <div className="space-y-2">
                <label className="block text-gray-700 font-medium mb-1">
                  Additional Features
                </label>

                {/* Pet-Friendly */}
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

                {/* Utility Billing Type */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1">
                    Utility Billing Type
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

              {/* Payment Term Details */}
              <h2 className="text-2xl font-bold mt-4 mb-4">
                Add Payment Term Details
              </h2>
              <p className="text-gray-500 mb-6">
                You can always change your payment term details later.
              </p>

              {/* Payment Inputs */}
              <div className="space-y-4">
                {/* Rent Payment */}
                {/* <div>
                  <label
                    htmlFor="rentPayment"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Rent Payment
                  </label>
                  <input
                    id="rentPayment"
                    type="number"
                    placeholder="1000"
                    min={0}
                    className="mt-1 block w-full rounded-md border p-3"
                    value={property.rentPayment || ""}
                    onChange={(e) =>
                      setProperty({ ...property, rentPayment: e.target.value })
                    }
                  />
                </div> */}

                {/* Security Deposit */}
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

                {/* Advanced Payment */}
                <div>
                  <label
                    htmlFor="advancedPayment"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Advanced Payment
                  </label>
                  <input
                    type="number"
                    id="advancedPayment"
                    min="0"
                    value={property.advancedPayment || ""}
                    placeholder="1"
                    onChange={(e) =>
                      setProperty({
                        ...property,
                        advancedPayment: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border p-3"
                  />
                </div>

                {/* Minimum Stay */}
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

                {/* Late Fee */}
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

                {/* Association Dues */}
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

                {/* Payment Frequency */}
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
              </div>
            </>
          )}
        </div>
      </div>

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
