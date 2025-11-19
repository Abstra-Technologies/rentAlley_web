"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { StepOneEdit } from "@/components/landlord/properties/editProperty/stepOne";
import { X, Check, Loader2 } from "lucide-react";
import axios from "axios";
import useEditPropertyStore from "@/zustand/property/useEditPropertyStore";
import useAuthStore from "@/zustand/authStore";
import Swal from "sweetalert2";

export default function EditProperty() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params?.id;

    const [loading, setLoading] = useState(false);
    const { fetchSession, user, admin } = useAuthStore();
    const { setProperty, setPhotos } = useEditPropertyStore();

    // Session check
    useEffect(() => {
        if (!user && !admin) fetchSession();
    }, [user, admin]);

    // Fetch property details
    useEffect(() => {
        if (!propertyId) return;

        axios
            .get(`/api/propertyListing/editProperty?property_id=${propertyId}`)
            .then((res) => {
                if (res.data.length > 0) {
                    const propertyData = res.data[0];
                    setProperty(propertyData);
                    setPhotos(propertyData.photos || []);
                } else {
                    Swal.fire({
                        title: "Not Found",
                        text: "Property does not exist.",
                        icon: "warning",
                    });
                    router.push("/pages/landlord/property-listing");
                }
            })
            .catch((err) => {
                console.error("Failed to load property data:", err);
                Swal.fire({
                    title: "Error",
                    text: "Unable to load property details.",
                    icon: "error",
                });
                router.push("/pages/landlord/property-listing");
            });
    }, [propertyId]);

    // SUBMIT HANDLER
    const handleSubmit = async () => {
        const { property, photos } = useEditPropertyStore.getState();

        // Basic validation
        if (
            !property.propertyName ||
            !property.street ||
            !property.brgyDistrict ||
            !property.city ||
            !property.province ||
            !property.zipCode
        ) {
            return Swal.fire({
                title: "Missing Information",
                text: "Please complete all required fields.",
                icon: "warning",
            });
        }

        const result = await Swal.fire({
            title: "Save Changes?",
            text: "Do you want to update this property?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, update it!",
        });

        if (!result.isConfirmed) return;

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("data", JSON.stringify(property));

            // Upload new photos only
            photos
                .filter((p) => p.isNew && p.file)
                .forEach((p) => formData.append("files", p.file));

            await axios.put(
                `/api/propertyListing/updatePropertyDetails?property_id=${propertyId}`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            Swal.fire({
                title: "Updated!",
                text: "Your property has been updated successfully.",
                icon: "success",
                confirmButtonColor: "#10b981",
            }).then(() => {
                router.replace("/pages/landlord/property-listing");
            });
        } catch (error) {
            console.error("Error updating property:", error);
            Swal.fire({
                title: "Error",
                text: "Failed to update property. Please try again.",
                icon: "error",
            });
        }

        setLoading(false);
    };

    // CANCEL
    const handleCancel = () => {
        Swal.fire({
            title: "Discard Changes?",
            text: "Any unsaved changes will be lost.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
        }).then((res) => {
            if (res.isConfirmed) router.push(`/pages/landlord/properties/${propertyId}`)});
    };

    const propertyName =
        useEditPropertyStore.getState().property?.propertyName || "Loading...";

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="px-4 pt-20 pb-24 md:pt-6 md:pb-8 md:px-8 lg:px-12 xl:px-16">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        Edit Property:{" "}
                        <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {propertyName}
            </span>
                    </h1>
                    <p className="text-sm text-gray-600">
                        Update your property details
                    </p>
                </div>

                {/* FULL PAGE FORM (Step 1 only) */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-4 md:p-6">
                        <StepOneEdit propertyId={propertyId} />
                    </div>
                </div>

                {/* Buttons */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky bottom-4 md:static">
                    <div className="p-4 flex items-center justify-between">

                        {/* Cancel */}
                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>

                        {/* Save */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg text-sm disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Update Property</span>
                                </>
                            )}
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}
