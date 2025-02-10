"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function PropertyDetails() {
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const params = useParams(); // Use useParams() instead of router.query
    const router = useRouter();
    const property_id = params.property_id; // Get the property ID from the URL

    useEffect(() => {
        if (!property_id) return; // Wait until ID is available

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

    if (loading) return <p className="text-center p-6">Loading...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    const isPDF = (url) => url && url.toLowerCase().endsWith(".pdf");
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-4">{property.property_name}</h1>
            <p><strong>Property ID:</strong> {property.property_id}</p>
            <p><strong>City:</strong> {property.city}</p>
            <p><strong>Province:</strong> {property.province}</p>
            <p><strong>Property Type:</strong> {property.property_type}</p>
            <p><strong>Status:</strong> {property.property_status}</p>
            <p><strong>Verification Status:</strong> {property.verification_status}</p>
            <p><strong>Security Deposit:</strong> ₱{property.sec_deposit}</p>
            <p><strong>Rent Payment:</strong> ₱{property.rent_payment}</p>

            <h2 className="text-2xl font-semibold mt-4">Verification Documents</h2>
            <p>{property.mayor_permit}</p>
            <div className="grid grid-cols-2 gap-4">
                {property.mayor_permit && (
                    isPDF(property.mayor_permit) ? (
                        <div className="border p-4">
                            <h3 className="font-semibold">Mayor’s Permit</h3>
                            <iframe
                                src={property.mayor_permit}
                                width="100%"
                                height="500px"
                                style={{ border: "none" }}
                            ></iframe>
                        </div>
                    ) : (
                        <img src={property.mayor_permit} alt="Mayor’s Permit" className="w-full h-40 object-cover border" />
                    )
                )}
                <p>OCC: {property.occ_permit}</p>
                <p>photo: {property.outdoor_photo}</p>
                {property.mayor_permit && <img src={property.mayor_permit} alt="Mayor’s Permit" />}
                {property.outdoor_photo && <img src={property.outdoor_photo} alt="Outdoor Photo" />}
                {property.indoor_photo && <img src={property.indoor_photo} alt="Indoor Photo" />}
            </div>

            <h2 className="text-2xl font-semibold mt-6">Property Photos</h2>
            <div className="grid grid-cols-3 gap-4">
                {property.photos && property.photos.map((photo, index) => (
                    <img key={index} src={photo} alt={`Property ${index}`} className="w-full h-40 object-cover border" />
                ))}
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
