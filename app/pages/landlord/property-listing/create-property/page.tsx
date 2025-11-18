"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import useSubscription from "@/hooks/landlord/useSubscription";

import StepOneMerged from "@/components/landlord/createProperty/StepOnePropertyDetails";
import StepTwoVerificationDocs from "@/components/landlord/createProperty/StepTwoVerificationDocs";
import StepCounter from "@/components/step-counter";

export default function AddNewProperty() {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    const { fetchSession, user } = useAuthStore();
    const { subscription, loadingSubscription } = useSubscription(user?.landlord_id);

    const {
        property,
        photos,
        submittedDoc,
        govID,
        indoorPhoto,
        outdoorPhoto,
        docType,
        reset,
    } = usePropertyStore();

    useEffect(() => {
        if (!user) fetchSession();
    }, [user]);

    /* ---------------- SUBSCRIPTION CHECK ---------------- */
    useEffect(() => {
        if (loadingSubscription || !user?.landlord_id) return;

        if (!subscription || subscription?.is_active !== 1) {
            Swal.fire({
                title: "Subscription Required",
                text: "You need an active subscription to add a property.",
                icon: "info",
                showConfirmButton: false,
                html: `
                    <button id="goBack" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
                      Go Back
                    </button>
                `,
                didOpen: () => {
                    document.getElementById("goBack").onclick = () => {
                        router.replace("/pages/landlord/property-listing");
                    };
                },
            });
        }
    }, [subscription, loadingSubscription, user]);

    /* ---------------- VALIDATION ---------------- */
    const validateStep = () => {
        if (step === 1) {
            if (
                !property.propertyName ||
                !property.propertyType ||
                !property.street ||
                !property.city ||
                !property.province ||
                !property.zipCode ||
                !property.floorArea ||
                !property.propDesc ||
                !property.waterBillingType ||
                !property.electricityBillingType
            ) {
                Swal.fire("Missing Fields", "Please fill all required details.", "warning");
                return false;
            }

            if (photos.length < 3) {
                Swal.fire("Insufficient Photos", "Upload at least 3 property photos.", "warning");
                return false;
            }
        }

        if (step === 2) {
            if (!submittedDoc || !govID || !indoorPhoto || !outdoorPhoto) {
                Swal.fire("Missing Documents", "Complete all verification documents.", "warning");
                return false;
            }
            if (submittedDoc.type !== "application/pdf") {
                Swal.fire("Invalid File", "Submitted document must be PDF.", "error");
                return false;
            }
        }

        return true;
    };

    const nextStep = () => validateStep() && setStep(2);
    const prevStep = () => setStep(1);

    /* ---------------- CANCEL CREATION ---------------- */
    const handleCancel = () => {
        Swal.fire({
            title: "Cancel Property Setup?",
            text: "All progress will be lost. Do you want to continue?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                reset();
                router.replace("/pages/landlord/property-listing");
            }
        });
    };

    /* ---------------- SUBMIT FULL PROPERTY ---------------- */
    const handleSubmit = async () => {
        if (!validateStep()) return;

        setSubmitting(true);

        const formData = new FormData();
        formData.append("landlord_id", user.landlord_id);
        formData.append("property", JSON.stringify(property));

        photos.forEach((p) => formData.append("photos", p.file));
        formData.append("docType", docType);
        formData.append("submittedDoc", submittedDoc);
        formData.append("govID", govID);
        formData.append("indoor", indoorPhoto);
        formData.append("outdoor", outdoorPhoto);

        try {
            await axios.post("/api/propertyListing/createFullProperty", formData);

            Swal.fire("Success!", "Property submitted successfully!", "success").then(() => {
                reset();
                router.replace("/pages/landlord/property-listing/review-listing");
            });
        } catch (error) {
            Swal.fire("Error", error.message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 px-4 md:px-10">

            {/* PAGE HEADER */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Property</h1>
            <p className="text-gray-600 mb-6">Fill in the details to create your listing.</p>

            <StepCounter currentStep={step} totalSteps={2} />

            {/* STEP CONTENT */}
            <div className="bg-white rounded-xl shadow-md border p-5 mb-6">
                {step === 1 && <StepOneMerged />}
                {step === 2 && <StepTwoVerificationDocs />}
            </div>

            {/* FOOTER NAVIGATION */}
            <div className="bg-white rounded-xl shadow-sm border p-4 flex justify-between items-center">

                {/* LEFT SIDE: Cancel + Back */}
                <div className="flex items-center gap-3">

                    {/* CANCEL BUTTON */}
                    <button
                        disabled={submitting}
                        onClick={handleCancel}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2"
                    >
                        <X className="w-4" />
                        Cancel
                    </button>

                    {/* BACK BUTTON */}
                    <button
                        disabled={submitting || step === 1}
                        onClick={prevStep}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4" />
                        Back
                    </button>
                </div>

                {/* RIGHT SIDE: Continue / Submit */}
                <div>
                    {step === 1 ? (
                        <button
                            onClick={nextStep}
                            disabled={submitting}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                        >
                            Continue <ArrowRight className="w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4" />
                                    Submit Listing
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
