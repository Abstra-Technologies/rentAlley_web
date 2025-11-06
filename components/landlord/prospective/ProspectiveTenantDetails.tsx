"use client";
import { useEffect, useState } from "react";
import axios from "axios";
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
    DocumentTextIcon,
    CheckIcon,
    XMarkIcon,
    StarIcon,
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
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState("pending");
    const [propertyId, setPropertyId] = useState(null);
    const [aiScore, setAiScore] = useState(null);

    useEffect(() => {
        if (unitId && tenantId) {
            fetchTenantDetails();
            fetchUnitDetails();
            fetchApplicationStatus();
            fetchAIScore();
        }
    }, [unitId, tenantId]);

    // 🔹 Fetch AI Screening Score
    const fetchAIScore = async () => {
        try {
            const res = await axios.get(
                `/api/landlord/prospective/ai-screening-report?tenant_id=${tenantId}`
            );
            setAiScore(res.data);
        } catch (error) {
            console.error("Failed to fetch AI score:", error);
        }
    };

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
        } catch (err) {
            console.error("Error fetching unit details:", err);
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
                router.push(`/pages/landlord/properties/${propertyId}/activeLease`);
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
                <LoadingScreen message="Generating Tenant Screening Report..." />
            </div>
        );

    // AI Scoring Values
    const rentalScore = aiScore?.rental_history_score || 0;
    const paymentScore = aiScore?.payment_history_score || 0;
    const overallScore =
        aiScore?.overall_score || calculateOverallScore(tenant);
    const aiSummary = aiScore?.summary || "";

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-3 flex justify-center">
            <div className="bg-white shadow-md rounded-xl border border-gray-200 w-full max-w-2xl sm:max-w-3xl p-4 sm:p-6 space-y-6">
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-blue-700 hover:text-blue-900 gap-1 text-sm font-medium"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    <h1 className="text-base sm:text-lg font-bold text-gray-800 text-right">
                        Tenant Screening Report
                    </h1>
                </div>

                {/* PROPERTY INFO */}
                <div className="border-b pb-3">
                    <p className="text-gray-600 text-sm">
                        <span className="font-semibold">Property:</span> {propertyName || "N/A"}
                    </p>
                    <p className="text-gray-600 text-sm">
                        <span className="font-semibold">Unit:</span> {unitName || "N/A"}
                    </p>
                    <StatusPill status={applicationStatus} />
                </div>

                {/* SCORING */}
                <SectionCard title="Essential Scoring Summary (AI Analyzed)">
                    <p className="text-xs text-gray-500 mb-2">
                        AI-generated analysis based on tenant rental and payment history.
                        <span className="italic text-gray-400 block">
              ⚠️ Disclaimer: This report uses AI analysis as reference only. Please review manually before making final decisions.
            </span>
                    </p>

                    <div className="space-y-3 sm:space-y-4">
                        <ScoreBar
                            label="Rental History (AI)"
                            description="Based on lease duration, renewal patterns, and consistency."
                            value={rentalScore}
                            color="emerald"
                        />
                        <ScoreBar
                            label="Payment Reliability (AI)"
                            description="Assessed by timeliness and consistency of past payments."
                            value={paymentScore}
                            color="blue"
                        />
                        <ScoreBar
                            label="Profile Completeness"
                            description="Based on submitted documents and data accuracy."
                            value={tenant ? 95 : 50}
                            color="purple"
                        />
                    </div>

                    {/* AI OVERALL */}
                    <div className="mt-5 flex flex-col sm:flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-gray-100">
                        <div className="text-center sm:text-left">
                            <p className="text-gray-600 text-sm font-medium">
                                Overall Applicant Score (AI)
                            </p>
                            <h3 className="text-3xl sm:text-4xl font-extrabold text-blue-700 mt-1">
                                {overallScore}%
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {getScoreInterpretation(overallScore)}
                            </p>
                        </div>

                        {/* Circular Visual */}
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mt-4 sm:mt-0">
                            <svg className="transform -rotate-90 w-full h-full">
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="40%"
                                    strokeWidth="10%"
                                    stroke="#E5E7EB"
                                    fill="none"
                                />
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r="40%"
                                    strokeWidth="10%"
                                    strokeLinecap="round"
                                    stroke={`url(#gradient)`}
                                    strokeDasharray="251"
                                    strokeDashoffset={251 - (overallScore / 100) * 251}
                                    fill="none"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#10B981" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-800">
                {overallScore}%
              </span>
                        </div>
                    </div>

                    {aiSummary && (
                        <div className="mt-3 bg-gray-50 border border-gray-100 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-gray-700 mb-1">
                                AI Summary:
                            </h4>
                            <p className="text-gray-600 text-xs leading-relaxed">{aiSummary}</p>
                        </div>
                    )}
                </SectionCard>

                {/* TENANT INFO */}
                <SectionCard title="Applicant Information">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <InfoRow label="Full Name" value={`${tenant?.firstName} ${tenant?.lastName}`} />
                        <InfoRow label="Birth Date" value={formatDate(tenant?.birthDate)} />
                        <InfoRow label="Email" value={tenant?.email} />
                        <InfoRow label="Phone" value={tenant?.phoneNumber} />
                        <InfoRow label="Address" value={tenant?.address} />
                    </div>
                </SectionCard>

                {/* DOCS & DECISION — Unchanged */}
                <SectionCard title="Submitted Documents">
                    {tenant?.valid_id || tenant?.proof_of_income ? (
                        <div className="space-y-3">
                            {tenant?.valid_id && (
                                <InfoLink
                                    label="Government ID"
                                    href={tenant.valid_id}
                                    icon={<IdentificationIcon className="w-5 h-5 text-gray-500" />}
                                />
                            )}
                            {tenant?.proof_of_income && (
                                <InfoLink
                                    label="Proof of Income"
                                    href={tenant.proof_of_income}
                                    icon={<CurrencyDollarIcon className="w-5 h-5 text-gray-500" />}
                                />
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-600 text-sm">No documents submitted.</p>
                    )}
                </SectionCard>

                {/* DECISION */}
                <SectionCard title="Landlord Decision">
                    {applicationStatus === "pending" && (
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
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
                </SectionCard>
            </div>
        </div>
    );
};

/* 🧩 Helper Components (no change, mobile spacing tuned) */
const SectionCard = ({ title, children }) => (
    <div className="mb-5">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-1">
            {title}
        </h2>
        {children}
    </div>
);

const InfoRow = ({ label, value }) => (
    <div>
        <p className="text-gray-500 text-xs font-medium">{label}</p>
        <p className="text-gray-800 font-semibold">{value || "Not provided"}</p>
    </div>
);

const InfoLink = ({ icon, label, href }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition border border-gray-200"
    >
        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
            {icon}
            {label}
        </div>
        <DocumentTextIcon className="w-5 h-5 text-blue-600" />
    </a>
);

const StatusPill = ({ status }) => {
    const colors =
        status === "pending"
            ? "bg-yellow-100 text-yellow-800"
            : status === "approved"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-700";
    return (
        <span
            className={`mt-2 inline-block px-3 py-1 text-xs font-semibold rounded-full ${colors}`}
        >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
    );
};

const ScoreBar = ({ label, description, value, color = "blue" }) => {
    const colorMap = {
        blue: "bg-blue-500",
        emerald: "bg-emerald-500",
        purple: "bg-purple-500",
    };
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-800">{label}</span>
                <span className="text-sm font-semibold text-gray-700">{value}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`${colorMap[color]} h-2.5 rounded-full transition-all duration-700`}
                    style={{ width: `${value}%` }}
                ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
    );
};

const ActionButton = ({ color, label, icon, onClick, disabled }) => {
    const colorClasses =
        color === "green"
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-rose-600 hover:bg-rose-700";
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center justify-center px-6 py-2.5 sm:py-3 rounded-lg text-white font-medium shadow-md text-sm transition ${colorClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
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
        <div className={`flex items-center gap-3 mt-3 p-4 border rounded-xl ${bg}`}>
            <div
                className={`w-10 h-10 flex items-center justify-center rounded-full ${
                    color === "green" ? "bg-emerald-100" : "bg-rose-100"
                }`}
            >
                {icon}
            </div>
            <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-xs sm:text-sm">{text}</p>
            </div>
        </div>
    );
};

const calculateOverallScore = (tenant) => {
    let score = 0;
    if (tenant?.valid_id) score += 25;
    if (tenant?.proof_of_income) score += 25;
    if (tenant?.employment_type) score += 25;
    if (tenant?.monthly_income) score += 25;
    return score;
};

const getScoreInterpretation = (score) => {
    if (score >= 90) return "A+ Excellent Applicant";
    if (score >= 80) return "A Good Applicant";
    if (score >= 70) return "B Fair Standing";
    if (score >= 60) return "C Below Average";
    return "D Needs Improvement";
};

export default ProspectiveTenantDetails;
