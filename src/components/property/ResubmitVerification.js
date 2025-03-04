'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

export default function ResubmitVerification({ property_id }) {
    const router = useRouter();
    const [property, setProperty] = useState(null);
    const [occPermit, setOccPermit] = useState(null);
    const [mayorPermit, setMayorPermit] = useState(null);
    const [govID, setGovID] = useState(null);
    const [indoorPhoto, setIndoorPhoto] = useState(null);
    const [outdoorPhoto, setOutdoorPhoto] = useState(null);

    useEffect(() => {
        if (property_id) {
            fetch(`/api/propertyListing/propListing?property_id=${property_id}`)
                .then((res) => res.json())
                .then((data) => setProperty(data))
                .catch((error) => console.error("Error fetching property:", error));
        }
    }, [property_id]);

    const handleFileChange = (e, setFile) => {
        const file = e.target.files[0];
        setFile(file);
    };

    const handleResubmit = async (e) => {
        e.preventDefault();

        if (!occPermit || !mayorPermit || !govID || !indoorPhoto || !outdoorPhoto) {
            Swal.fire("Missing Files", "Please upload all required documents.", "warning");
            return;
        }

        const formData = new FormData();
        formData.append("property_id", property_id);
        formData.append("occPermit", occPermit);
        formData.append("mayorPermit", mayorPermit);
        formData.append("govID", govID);
        formData.append("indoor", indoorPhoto);
        formData.append("outdoor", outdoorPhoto);

        try {
            await axios.post("/api/propertyListing/propVerify", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Swal.fire("Success", "Verification documents resubmitted successfully.", "success");
            router.push("/pages/landlord/property-listing/review-listing");
        } catch (error) {
            Swal.fire("Error", `Failed to resubmit verification: ${error.message}`, "error");
        }
    };

    return (
        <div className="p-6 bg-white shadow-md rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Occupancy Permit (PDF)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, setOccPermit)} className="mt-1 block w-full" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Mayor’s Permit (PDF)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, setMayorPermit)} className="mt-1 block w-full" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Government ID (Image/PDF)</label>
                    <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, setGovID)} className="mt-1 block w-full" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Indoor Property Photo</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setIndoorPhoto)} className="mt-1 block w-full" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Outdoor Property Photo</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setOutdoorPhoto)} className="mt-1 block w-full" />
                </div>
            </div>

            <button
                onClick={handleResubmit}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
                Resubmit for Verification
            </button>
        </div>
    );
}
