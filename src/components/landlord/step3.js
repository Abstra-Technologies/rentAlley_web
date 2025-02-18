import usePropertyStore from "../../pages/zustand/propertyStore";
import { FaImage } from "react-icons/fa"; // Import checkmark icon from react-icons
import { useDropzone } from "react-dropzone";

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

    setProperty({
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    });
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
            <label className="block text-gray-700 font-medium mb-1">
              Number of Units (if Applicable)
            </label>
            <input
              type="number"
              name="numberOfUnit"
              value={property.numberOfUnit || ""}
              onChange={handleChange}
              placeholder="2"
              min="0"
              className="w-full p-2 border rounded"
            />
          </div>

          <p className="text-gray-500 font-bold mb-4">
            Only fill up fields below if you don't have units.
          </p>
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
                checked={property.petFriendly === 1} // Ensure it checks based on 1
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
                checked={property.bedSpacing === 1} // Ensure it checks based on 1
                onChange={handleChange}
                className="h-6 w-6"
              />
              <label className="text-gray-700">
                Bed Spacing (if applicable)
              </label>
            </div>

            {/* Show Input for Available Bed Spacing */}
            {property.bedSpacing === 1 && (
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Available Bed Spacing (in number)
                </label>
                <input
                  type="number"
                  name="availBeds"
                  value={property.availBeds || ""}
                  onChange={handleChange}
                  placeholder="Enter available bed spacing"
                  className="w-full p-2 border rounded"
                />
              </div>
            )}
          </div>
        </div>
        <h2 className="text-2xl font-bold mt-4 mb-4">
          Add Payment Term Details
        </h2>
        <p className="text-gray-500 mb-6">
          You can always change your payment term details later.
        </p>
        {/* Payment term details inputs */}
        <div className="space-y-4">
          <div>
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
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg p-3"
              value={property.rentPayment || ""}
              onChange={(e) =>
                setProperty({ ...property, rentPayment: e.target.value })
              }
            />
          </div>
          <div>
            <label
              htmlFor="advancedPayment"
              className="block text-sm font-medium text-gray-700"
            >
              Advanced Payment (Months)
            </label>
            <input
              type="number"
              id="advancedPayment"
              min="0" // Prevents negative values
              value={property.advancedPayment || ""}
              placeholder="1"
              onChange={(e) =>
                setProperty({
                  ...property,
                  advancedPayment: Number(e.target.value),
                })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg p-3"
            />
          </div>

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
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg p-3"
              value={property.secDeposit || ""}
              onChange={(e) =>
                setProperty({ ...property, secDeposit: e.target.value })
              }
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
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg p-3"
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
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg p-3"
              value={property.lateFee || ""}
              onChange={(e) =>
                setProperty({ ...property, lateFee: e.target.value })
              }
            />
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Utility Bill (Check if included)
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                id="hasWater"
                type="checkbox"
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-6 w-6"
                checked={property.hasWater || 0}
                onChange={(e) =>
                  setProperty({ ...property, hasWater: e.target.checked })
                }
              />
              <span className="ml-3 text-lg text-gray-700">Water Bill</span>
            </label>
            <label className="inline-flex items-center">
              <input
                id="hasElectricity"
                type="checkbox"
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-6 w-6"
                checked={property.hasElectricity || 0}
                onChange={(e) =>
                  setProperty({
                    ...property,
                    hasElectricity: e.target.checked,
                  })
                }
              />
              <span className="ml-3 text-lg text-gray-700">
                Electricity Bill
              </span>
            </label>
          </div>
          <label
            htmlFor="hasAssocDues"
            className="block text-sm font-medium text-gray-700"
          >
            Others
          </label>
          <label className="inline-flex items-center">
            <input
              id="hasAssocDues"
              type="checkbox"
              className="rounded border-gray-300 text-blue-500 focus:ring-blue-500 h-6 w-6"
              checked={property.hasAssocDues || 0}
              onChange={(e) =>
                setProperty({ ...property, hasAssocDues: e.target.checked })
              }
            />
            <span className="ml-3 text-lg text-gray-700">Association Dues</span>
          </label>
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
