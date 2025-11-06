"use client";

import { useParams } from "next/navigation";
import axios from "axios";
import { useState } from "react";
import Swal from "sweetalert2";
import PropertyConfiguration from "@/components/landlord/properties/propertyConfigSettings";

export default function PropertyConfigurationPage() {
    const { id } = useParams();
    const property_id = id;
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        try {
            setIsUpdating(true);
            const response = await axios.get("/api/propertyListing/getPropDetailsById", {
                params: { property_id },
            });

            Swal.fire({
                icon: "success",
                title: "Updated!",
                text: "Utility settings updated and rates reloaded.",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error("Failed to reload property details after update:", error);
            Swal.fire({
                icon: "error",
                title: "Failed!",
                text: "Could not refresh property details after update.",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6">
            <div className="max-w-4xl mx-auto bg-white border border-gray-100 shadow-md rounded-2xl p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                    Property Configuration
                </h1>
                <p className="text-sm text-gray-600 mb-4">
                    Manage your billing rules, reminders, and late fee settings for this property.
                </p>

                {/* Your existing component */}
                <PropertyConfiguration
                    propertyId={property_id}
                    onUpdate={handleUpdate}
                />
            </div>
        </div>
    );
}
