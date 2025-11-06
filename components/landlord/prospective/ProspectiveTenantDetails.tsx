"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import {
    EnvelopeIcon,
    IdentificationIcon,
    BriefcaseIcon,
    CurrencyDollarIcon,
    UserIcon,
    PhoneIcon,
    MapPinIcon,
    CalendarIcon,
    DocumentTextIcon,
    CheckIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import LoadingScreen from "@/components/loadingScreen";

const ProspectiveTenantDetails = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const unitId = searchParams.get("unit_id");
    const tenantId = searchParams.get("tenant_id");

    const [tenant, setTenant] = useState(null);
    const [propertyName, setPropertyName] = useState("");
    const [unitName, setUnitName] = useState("");
    const [unitPhotos, setUnitPhotos] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState("pending");
    const [propertyId, setPropertyId] = useState(null);

    useEffect(() => {
        if (unitId && tenantId) {
            fetchTenantDetails();
            fetchUnitDetails();
            fetchApplicationStatus();
        }
    }, [unitId, tenantId]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "Invalid Date";
        }
    };

    const fetchApplicationStatus = async () => {
        try {
            const { data } = await axios.get(
                `/api/landlord/prospective/getProspecStatus?unit_id=${unitId}&tenant_id=${tenantId}`
            );
            setApplicationStatus(data.status);
        } catch (error) {
            console.error("Error fetching application status:", error);
        }
    };

    const fetchUnitDetails = async () => {
        try {
            const res = await axios.get(
                `/api/propertyListing/getPropertyDetailByUnitId?unit_id=${unitId}`
            );
            const d = res.data?.propertyDetails;
            if (d) {
                setPropertyName(d.property_name || "");
                setUnitName(d.unit_name || "");
                setPropertyId(d.property_id || null);
            }
            const photos = res.data?.unitPhotos;
            setUnitPhotos(Array.isArray(photos) ? photos : photos ? [photos] : []);
        } catch (err) {
            console.error("Error fetching unit details:", err);
            setUnitPhotos([]);
        }
    };

    const fetchTenantDetails = async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get(
                `/api/landlord/prospective/interestedTenants?tenant_id=${tenantId}`
            );
            if (data) setTenant(data);
        } catch (error) {
            console.error("Error fetching tenant details:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateTenantStatus = async (newStatus) => {
        let disapprovalReason = null;

        if (newStatus === "disapproved") {
            const { value } = await Swal.fire({
                title: "Disapprove Tenant",
                input: "textarea",
                inputLabel: "Provide a reason for disapproval",
                inputPlaceholder: "Type your reason here...",
                showCancelButton: true,
            });
            if (!value) return;
            disapprovalReason = value;
        }

        setIsProcessing(true);
        try {
            const payload = {
                unitId,
                tenant_id: tenant?.tenant_id,
                status: newStatus,
                message: disapprovalReason,
            };

            await axios.put(
                "/api/landlord/prospective/updateApplicationStatus",
                payload
            );

            setApplicationStatus(newStatus);

            await Swal.fire({
                icon: "success",
                title: "Status Updated",
                text: `Tenant application marked as ${newStatus}.`,
                confirmButtonColor: "#3085d6",
            });

            if (newStatus === "approved") {
                router.push(
                    `/pages/landlord/properties/{propertyId}/activeLease`
                );
            } else router.back();
        } catch (error) {
            console.error("Error updating tenant status:", error);
            Swal.fire("Error!", "Failed to update tenant status.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading)
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <LoadingScreen message="Just a moment, getting tenant info ready..." />
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50 p-4 sm:p-6">
            {/* 🔙 Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center text-blue-700 hover:text-blue-900 mb-4 sm:mb-6 group transition-all"
            >
                <ArrowLeft className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                <span className="font-medium text-sm sm:text-base">
          Back to Prospective Tenants
        </span>
            </button>

            <div className="max-w-6xl mx-auto space-y-6">
                {/* 🏡 Property Header */}
                <div className="relative bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                    {unitPhotos.length ? (
                        <div className="flex overflow-x-auto space-x-3 snap-x snap-mandatory scroll-smooth p-2">
                            {unitPhotos.map((photo, i) => (
                                <div
                                    key={i}
                                    className="relative flex-shrink-0 w-64 sm:w-80 h-40 sm:h-48 rounded-xl overflow-hidden snap-center"
                                >
                                    <Image
                                        src={photo}
                                        alt={`Unit Photo ${i + 1}`}
                                        fill
                                        className="object-cover rounded-xl"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center bg-gray-200">
                            <p className="text-gray-500 text-sm">No Images Available</p>
                        </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 sm:p-6">
                        <h1 className="text-white text-lg sm:text-2xl font-bold truncate">
                            {propertyName || "Property"}
                        </h1>
                        <p className="text-white text-sm sm:text-lg font-medium">
                            Unit {unitName || ""}
                        </p>
                    </div>
                </div>

                {/* 📋 Tenant Application */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                            Tenant Application Review
                        </h2>
                        <span
                            className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm ${
                                applicationStatus === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : applicationStatus === "approved"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-rose-100 text-rose-700"
                            }`}
                        >
              {applicationStatus === "pending"
                  ? "Pending Review"
                  : applicationStatus === "approved"
                      ? "Approved"
                      : "Rejected"}
            </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 👤 Tenant Profile */}
                        <div className="bg-gradient-to-br from-blue-50 via-teal-50 to-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-3">
                                    {tenant?.profilePicture ? (
                                        <Image
                                            src={tenant.profilePicture}
                                            alt="Profile"
                                            fill
                                            className="object-cover rounded-full"
                                        />
                                    ) : (
                                        <UserIcon className="w-10 h-10 text-gray-400 absolute inset-0 m-auto" />
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {tenant?.firstName} {tenant?.lastName}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    DOB: {formatDate(tenant?.birthDate)}
                                </p>
                            </div>

                            <div className="mt-6 space-y-4">
                                <ContactItem
                                    color="blue"
                                    icon={<EnvelopeIcon className="w-4 h-4 text-blue-600" />}
                                    label="Email"
                                    value={tenant?.email}
                                />
                                <ContactItem
                                    color="green"
                                    icon={<PhoneIcon className="w-4 h-4 text-green-600" />}
                                    label="Phone"
                                    value={tenant?.phoneNumber}
                                />
                            </div>
                        </div>

                        {/* 🧾 Application Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Applicant Information
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <InfoField
                                        icon={<BriefcaseIcon className="w-5 h-5 text-gray-500" />}
                                        label="Occupation"
                                        value={tenant?.occupation}
                                    />
                                    <InfoField
                                        icon={<UserIcon className="w-5 h-5 text-gray-500" />}
                                        label="Employment Type"
                                        value={tenant?.employment_type}
                                    />
                                    <InfoField
                                        icon={<CurrencyDollarIcon className="w-5 h-5 text-gray-500" />}
                                        label="Monthly Income"
                                        value={tenant?.monthly_income?.replace("_", "-")}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <InfoField
                                        icon={<MapPinIcon className="w-5 h-5 text-gray-500" />}
                                        label="Current Address"
                                        value={tenant?.address}
                                    />

                                    {tenant?.valid_id && (
                                        <InfoLink
                                            icon={<IdentificationIcon className="w-5 h-5 text-gray-500" />}
                                            label="Government ID"
                                            href={tenant.valid_id}
                                        />
                                    )}

                                    {tenant?.proof_of_income && (
                                        <InfoLink
                                            icon={<CurrencyDollarIcon className="w-5 h-5 text-gray-500" />}
                                            label="Proof of Income"
                                            href={tenant.proof_of_income}
                                        />
                                    )}
                                </div>
                            </div>

                            {tenant?.application_message && (
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                    <h4 className="font-medium text-gray-800 mb-1">
                                        Application Message
                                    </h4>
                                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                                        {tenant.application_message}
                                    </p>
                                </div>
                            )}

                            {/* 🔘 Action Buttons */}
                            {applicationStatus === "pending" && (
                                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
                                    <ActionButton
                                        color="green"
                                        label="Approve Tenant"
                                        icon={<CheckIcon className="h-5 w-5 mr-2" />}
                                        onClick={() => updateTenantStatus("approved")}
                                        disabled={isProcessing}
                                    />
                                    <ActionButton
                                        color="red"
                                        label="Reject Application"
                                        icon={<XMarkIcon className="h-5 w-5 mr-2" />}
                                        onClick={() => updateTenantStatus("disapproved")}
                                        disabled={isProcessing}
                                    />
                                </div>
                            )}

                            {applicationStatus === "approved" && (
                                <StatusBanner
                                    color="green"
                                    title="Application Approved"
                                    text="This tenant has been approved for this unit."
                                    icon={<CheckIcon className="h-6 w-6" />}
                                />
                            )}

                            {applicationStatus === "disapproved" && (
                                <StatusBanner
                                    color="red"
                                    title="Application Rejected"
                                    text="This tenant's application has been rejected."
                                    icon={<XMarkIcon className="h-6 w-6" />}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* 🔹 Helper Components */
const InfoField = ({ icon, label, value }) => (
    <div>
        <div className="flex items-center gap-2 mb-1">{icon}<p className="font-medium text-gray-700">{label}</p></div>
        <p className="text-gray-600 pl-7 text-sm sm:text-base">{value || "Not provided"}</p>
    </div>
);

const InfoLink = ({ icon, label, href }) => (
    <div>
        <div className="flex items-center gap-2 mb-1">{icon}<p className="font-medium text-gray-700">{label}</p></div>
        <a href={href} target="_blank" rel="noopener noreferrer" className="pl-7 text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-sm">
            <DocumentTextIcon className="w-4 h-4" />
            <span>View Document</span>
        </a>
    </div>
);

const ContactItem = ({ color, icon, label, value }) => (
    <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${color === "blue" ? "bg-blue-100" : "bg-green-100"}`}>{icon}</div>
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-medium break-all">{value}</p>
        </div>
    </div>
);

const ActionButton = ({ color, label, icon, onClick, disabled }) => {
    const colorClasses = color === "green" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700";
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-5 py-3 sm:px-6 sm:py-3 rounded-lg text-white font-medium shadow-md transition-all flex items-center justify-center text-sm sm:text-base ${colorClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {icon}
            {disabled ? "Processing..." : label}
        </button>
    );
};

const StatusBanner = ({ color, title, text, icon }) => {
    const bg =
        color === "green"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-rose-50 border-rose-200 text-rose-800";
    return (
        <div className={`mt-4 sm:mt-6 p-4 border rounded-xl flex items-center gap-3 ${bg}`}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full ${color === "green" ? "bg-emerald-100" : "bg-rose-100"}`}>{icon}</div>
            <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-xs sm:text-sm">{text}</p>
            </div>
        </div>
    );
};

export default ProspectiveTenantDetails;
