"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useAuth from "../../../../../../../hooks/useSession";
import PropertyPhotos from "../../../../../../components/PropertyPhotos"

export default function PropertyDetails() {
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const params = useParams();
    const router = useRouter();
    const property_id = params.property_id;
    const [message, setMessage] = useState("");


    useEffect(() => {
        if (!property_id) return;

        async function fetchProperty() {
            try {
                const res = await fetch(`/api/properties/${property_id}`);
                const data = await res.json();

                if (data.message) {
                    setError(data.message);
                } else {
                    setProperty(data);
                }
            } catch (err) {
                setError("Failed to load property details.");
            }
            setLoading(false);
        }

        fetchProperty();
    }, [property_id]);

    const handleUpdateStatus = async (status) => {
        try {
            const res = await fetch("/api/properties/propertyStatus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ property_id, status, message }),
            });

            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                router.push("/pages/system_admin/propertyManagement/list");
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert("Error updating property status.");
        }
    };

    if (loading) return <p className="text-center p-6">Loading...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    const isPDF = (url) => url && url.toLowerCase().endsWith(".pdf");
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-4">{property.property_name}</h1>
            <p><strong>Property ID:</strong> {property.property_id}</p>
            <p><strong>City:</strong> {property.city}</p>
            <p><strong>Barangay:</strong> {property.brgy_district}</p>
            <p><strong>ZIP Code:</strong> {property.zip_code}</p>

            <p><strong>Province:</strong> {property.province}</p>
            <p><strong>Property Type:</strong> {property.property_type}</p>
            <p><strong>Security Deposit:</strong> ₱{property.sec_deposit}</p>
            <p><strong>Rent Payment:</strong> ₱{property.rent_payment}</p>

            <h2 className="text-2xl font-semibold mt-4">Verification Documents</h2>
            <div className="grid grid-cols-2 gap-4">
                {property.mayor_permit && (
                    isPDF(property.mayor_permit) ? (
                        <div className="border p-4">
                            <h3 className="font-semibold">Mayor’s Permit</h3>
                            <iframe
                                src={property.mayor_permit}
                                width="100%"
                                height="500px"
                                style={{border: "none"}}
                            ></iframe>
                        </div>
                    ) : (
                        <img src={property.mayor_permit} alt="Mayor’s Permit"
                             className="w-full h-40 object-cover border"/>
                    )
                )}

                {property.occ_permit && (
                    isPDF(property.occ_permit) ? (
                        <div className="border p-4">
                            <h3 className="font-semibold">Occupancy’s Permit</h3>
                            <iframe
                                src={property.occ_permit}
                                width="100%"
                                height="500px"
                                style={{border: "none"}}
                            ></iframe>
                        </div>
                    ) : (
                        <img src={property.occ_permit} alt="Occupancy’s Permit"
                             className="w-full h-40 object-cover border"/>
                    )
                )}
                <p>photo: {property.indoor_photo}</p>
                <img src={property.indoor_photo} />
                {property.outdoor_photo && <img src={property.outdoor_photo} alt="Outdoor Photo"/>}
                {property.indoor_photo && <img src={property.indoor_photo} alt="Indoor Photo"/>}
            </div>

            <h2 className="text-2xl font-semibold mt-6">Property Photos</h2>
            <div className="grid grid-cols-3 gap-4">
                <PropertyPhotos property_id={property_id} />
            </div>

            <h1 className='text-3xl m-3'>Approval Section</h1>
            <div className="container mx-auto p-6">
                {property.admin_message && (
                    <p className="text-red-500"><strong>Admin Message:</strong> {property.admin_message}</p>
                )}
                {property.admin_id && (
                    <p className="text-gray-500"><strong>Last Updated by Admin:</strong> {property.admin_id}</p>
                )}

                {/* Admin Approval Section */}
                <div className="mt-6 p-4 border border-gray-300 rounded-md">
                    <h2 className="text-xl font-semibold mb-2">Admin Approval</h2>

                    <textarea
                        placeholder="Enter rejection message (if applicable)"
                        className="w-full border p-2 mt-2"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />

                    <div className="flex gap-4 mt-4">
                        <button
                            className="bg-green-600 text-white px-4 py-2 rounded"
                            onClick={() => handleUpdateStatus("Verified")}
                        >
                            Approve
                        </button>
                        <button
                            className="bg-red-600 text-white px-4 py-2 rounded"
                            onClick={() => handleUpdateStatus("Rejected")}
                        >
                            Reject
                        </button>
                    </div>
                </div>
            </div>
            <button
                className="mt-6 bg-gray-600 text-white px-4 py-2 rounded"
                onClick={() => router.push('/properties')}
            >
                Back to Properties
            </button>
        </div>
    );
}
