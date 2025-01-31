import React, { useState, useEffect } from "react";
import axios from "axios";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Define the Zod schema for validation
const profileSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required." }),
  lastName: z.string().min(2, { message: "Last name is required." }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z
    .string()
    .regex(/^\d{12}$/, { message: "Phone Number must be 12 digits." }),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Invalid date format. Use YYYY-MM-DD.",
  }),
  password: z.string().optional(),
});

const ProfileForm = ({ userId, isLandlord = false }) => {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    birthDate: "",
    password: "",
    profilePicture: null,
    landlordId: null,
    verificationStatus: "not verified",
  });
  const [file, setFile] = useState(null); // For storing the selected file
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Fetch current profile data
    if (userId) {
      axios
        .get(`/api/profile/${userId}`)
        .then((response) => {
          const { data } = response;
          setProfile({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            birthDate: new Date(data.birthDate).toISOString().split("T")[0],
            password: "", // Reset password field
            profilePicture: data.profilePicture,
            landlordId: data.landlordId,
            verificationStatus: data.verificationStatus,
          });
          console.log("Data: ", data);
        })
        .catch(() => setErrors("Failed to load profile data"));
    }
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setProfile((prevProfile) => ({
      ...prevProfile,
      profilePicture: URL.createObjectURL(selectedFile), // Update the preview
    }));
    console.log("Selected file:", file);
  };

  // Handle form submission and validation
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate the profile data using Zod
    try {
      profileSchema.parse({
        ...profile,
        profilePicture: file,
      });

      const formData = new FormData();
      formData.append("firstName", profile.firstName);
      formData.append("lastName", profile.lastName);
      formData.append("email", profile.email);
      formData.append("phoneNumber", profile.phoneNumber);
      formData.append("birthDate", profile.birthDate);
      formData.append("password", profile.password);

      if (file) {
        formData.append("profilePicture", file); // Attach the actual file
      }

      // Send the data to the backend
      const response = await axios.put(`/api/profile/${userId}`, formData);

      // Update profile picture if changed
      setProfile((prevProfile) => ({
        ...prevProfile,
        profilePicture:
          response.data.profilePicture || prevProfile.profilePicture,
      }));

      setSuccessMessage("Profile updated successfully");
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        const newErrors = error.errors.reduce((acc, curr) => {
          acc[curr.path[0]] = curr.message; // Map Zod errors to the state
          return acc;
        }, {});
        setErrors(newErrors);
      } else {
        setErrorMessage("Update Failed");
      }
    }
  };

  console.log("Profile after submission: ", profile);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Edit Profile
        </h2>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="text-green-500 mb-4">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="text-red-500 mb-4">{errorMessage}</div>
        )}

        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24">
            <Image
              src={
                profile.profilePicture ||
                "https://upload.wikimedia.org/wikipedia/commons/a/a2/Person_Image_Placeholder.png?20230410144854"
              }
              alt="Profile"
              className="w-full h-full object-cover rounded-full border-2 border-gray-300" // Ensures the image covers the circle perfectly
              width={96} // Adjusted width for better fitting
              height={96} // Adjusted height for better fitting
            />
          </div>
          {/* Added a hidden file input to handle image uploads */}
          <input
            type="file"
            id="profilePicture"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange} // Function to handle the image change
          />
          <label
            htmlFor="profilePicture"
            className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-md cursor-pointer hover:bg-blue-700 transition-colors" // Adjusted to high contrast and cursor-pointer
          >
            Change Picture
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          {isLandlord && profile.landlordId && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Landlord ID
                </label>
                <input
                    type="text"
                    value={profile.landlordId}
                    disabled
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
          )}
          {isLandlord && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Verification Status
                </label>
                <div
                    className={`mt-1 p-2 border rounded-md 
                ${
                        profile.verificationStatus === "approved"
                            ? "bg-green-100 border-green-500 text-green-600"
                            : profile.verificationStatus === "not verified"
                                ? "bg-yellow-100 border-yellow-500 text-yellow-600"
                                : "bg-red-100 border-red-500 text-red-600"
                    }`}
                >
                  {profile.verificationStatus.toUpperCase()}
                </div>
              </div>
          )}
          {isLandlord && profile.verificationStatus !== "approved" && (
              <div className="mb-4">
                <button
                    onClick={() => router.push("/pages/landlord/verification")} // Redirect to verification page
                    className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors"
                >
                  Verify Now
                </button>
              </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={profile.firstName || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={profile.lastName || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Mobile Number
            </label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={profile.phoneNumber || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm">{errors.phoneNumber}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="birthDate"
              className="block text-sm font-medium text-gray-700"
            >
              Date of Birth
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={profile.birthDate || ""}
              onChange={handleChange}
              aria-label="Date of Birth" // Adds a clear label for screen readers
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.birthDate && (
              <p className="text-red-500 text-sm">{errors.birthDate}</p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={profile.password || ""}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {isLandlord && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Subscription Status
                </label>
                <div className="mt-1 p-2 border border-gray-300 rounded-md bg-gray-100">
                  Free
                </div>
              </div>
              <div className="mb-6">
                <button
                  type="button"
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                >
                  Manage Subscription
                </button>
              </div>
            </>
          )}

          {/* Buttons for Save Changes and Delete Account */}
          <div className="flex justify-between space-x-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors" // Updated to a blue contrast color
            >
              Save Changes
            </button>
            <button
              type="button"
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors" // Increased contrast color for Delete Account button
              //onClick={handleDelete}
            >
              Delete Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileForm;
