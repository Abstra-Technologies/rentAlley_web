"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import axios from "axios";
import Swal from "sweetalert2";
import { buildLeaseTemplate } from "@/utils/buildLeaseTemplate";
import useAuthStore from "@/zustand/authStore";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

export default function LeaseEditor() {
    const { agreement_id } = useParams();
    const router = useRouter();
    const { user, fetchSession } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [content, setContent] = useState("");

    // Core prefilled data
    const [tenant, setTenant] = useState({ name: "", email: "", phone: "" });
    const [property, setProperty] = useState({ name: "", unit: "", rent: "" });
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [depositAmount, setDepositAmount] = useState("");
    const [advanceAmount, setAdvanceAmount] = useState("");
    const [billingDueDay, setBillingDueDay] = useState("1");
    const [gracePeriod, setGracePeriod] = useState("3");
    const [latePenalty, setLatePenalty] = useState("1000");

    const [infoSource, setInfoSource] = useState({}); // track where values came from

    // ---- Fetch lease + related info by agreement_id ----
    useEffect(() => {
        if (!agreement_id) return;

        const fetchLeaseData = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/leaseAgreement/getDetailedLeaseInfo/${agreement_id}`);
                const d = res.data;

                setTenant({
                    name: d.tenant_name || "",
                    email: d.email || "",
                    phone: d.phoneNumber || "",
                });

                setProperty({
                    name: d.property_name || "N/A",
                    unit: d.unit_name || "N/A",
                    rent: d.rent_amount || "0",
                });

                setStartDate(d.start_date || "");
                setEndDate(d.end_date || "");
                setDepositAmount(d.security_deposit_amount || "");
                setAdvanceAmount(d.advance_payment_amount || "");
                setBillingDueDay(d.billing_due_day?.toString() || "1");
                setGracePeriod(d.grace_period_days?.toString() || "3");
                setLatePenalty(d.late_penalty_amount?.toString() || "1000");
                setInfoSource(d.info_source || {});
            } catch (error) {
                console.error("Error fetching lease details:", error);
                Swal.fire("Error", "Failed to load lease details.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchLeaseData();
    }, [agreement_id]);

    // ---- Build lease preview ----
    useEffect(() => {
        if (step === 3) {
            const html = buildLeaseTemplate({
                lessorName: `${user?.firstName || ""} ${user?.lastName || ""}`,
                tenantName: tenant.name,
                propertyName: property.name,
                address: property.unit,
                startDate,
                endDate,
                rentAmount: property.rent,
                depositAmount,
                advanceAmount,
                billingDueDay,
                gracePeriod,
                latePenalty,
            });
            setContent(html);
        }
    }, [step, tenant, property, startDate, endDate]);

    // ---- Handle save/generate ----
    const handleGenerateLease = async () => {
        try {
            setLoading(true);
            await axios.post("/api/leaseAgreement/generate", {
                agreement_id,
                content,
                startDate,
                endDate,
            });
            Swal.fire("Success", "Lease Agreement generated successfully!", "success");
            router.push(`/pages/lease/signing?agreementId=${agreement_id}`);
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "Failed to generate lease.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-500">
                Loading lease data...
            </div>
        );

    return (
        <div className="max-w-4xl mx-auto mt-10 bg-white p-6 rounded-2xl shadow-lg">
            {/* 🏠 Property Header */}
            <div className="mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    Lease Agreement Generator for {property.name}
                </h1>
                <p className="text-gray-600 text-sm">
                    Unit: <span className="font-medium">{property.unit}</span> • Rent:{" "}
                    <span className="font-medium">
            ₱{parseFloat(property.rent || 0).toLocaleString("en-PH")}
          </span>
                </p>
            </div>

            {/* Stepper */}
            <div className="flex flex-wrap gap-2 mb-6">
                {["Tenant & Dates", "Financial Terms", "Review"].map((label, i) => (
                    <span
                        key={label}
                        className={`px-3 py-1 rounded-full text-sm ${
                            step === i + 1
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-800"
                        }`}
                    >
            {label}
          </span>
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Tenant Name</label>
                        <input
                            value={tenant.name}
                            readOnly
                            className="w-full border rounded p-2 bg-gray-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input
                            value={tenant.email}
                            readOnly
                            className="w-full border rounded p-2 bg-gray-100"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border rounded p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full border rounded p-2"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => setStep(2)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-5">
                    {/* ℹ️ Info Section if property config values used */}
                    {(infoSource?.billing_due_day === "property_config" ||
                        infoSource?.grace_period_days === "property_config" ||
                        infoSource?.late_penalty_amount === "property_config") && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-blue-800 text-sm">
                            ℹ️ The billing due day, grace period, and late fee below are pre-set in your
                            <strong> Property Configuration</strong> and cannot be changed here.
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium">Security Deposit (₱)</label>
                        <input
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Advance Payment (₱)</label>
                        <input
                            value={advanceAmount}
                            onChange={(e) => setAdvanceAmount(e.target.value)}
                            className="w-full border rounded p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium flex items-center gap-2">
                            Billing Due Day
                            {infoSource?.billing_due_day === "property_config" && (
                                <span className="text-xs text-blue-600 font-medium">(From Property Config)</span>
                            )}
                        </label>
                        <select
                            value={billingDueDay}
                            onChange={(e) => setBillingDueDay(e.target.value)}
                            disabled={infoSource?.billing_due_day === "property_config"}
                            className={`w-full border rounded p-2 ${
                                infoSource?.billing_due_day === "property_config"
                                    ? "bg-gray-100 cursor-not-allowed text-gray-500"
                                    : ""
                            }`}
                        >
                            {Array.from({ length: 31 }, (_, i) => (
                                <option key={i}>{i + 1}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium flex items-center gap-2">
                            Grace Period (days)
                            {infoSource?.grace_period_days === "property_config" && (
                                <span className="text-xs text-blue-600 font-medium">(From Property Config)</span>
                            )}
                        </label>
                        <input
                            value={gracePeriod}
                            onChange={(e) => setGracePeriod(e.target.value)}
                            readOnly={infoSource?.grace_period_days === "property_config"}
                            className={`w-full border rounded p-2 ${
                                infoSource?.grace_period_days === "property_config"
                                    ? "bg-gray-100 cursor-not-allowed text-gray-500"
                                    : ""
                            }`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium flex items-center gap-2">
                            Late Penalty (₱/day)
                            {infoSource?.late_penalty_amount === "property_config" && (
                                <span className="text-xs text-blue-600 font-medium">(From Property Config)</span>
                            )}
                        </label>
                        <input
                            value={latePenalty}
                            onChange={(e) => setLatePenalty(e.target.value)}
                            readOnly={infoSource?.late_penalty_amount === "property_config"}
                            className={`w-full border rounded p-2 ${
                                infoSource?.late_penalty_amount === "property_config"
                                    ? "bg-gray-100 cursor-not-allowed text-gray-500"
                                    : ""
                            }`}
                        />
                    </div>

                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() => setStep(1)}
                            className="px-4 py-2 bg-gray-300 rounded-lg"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
                        >
                            Review →
                        </button>
                    </div>
                </div>
            )}


            {step === 3 && (
                <div className="space-y-4">
                    <ReactQuill value={content} readOnly theme="snow" />
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() => setStep(2)}
                            className="px-4 py-2 bg-gray-300 rounded-lg"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={handleGenerateLease}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
                        >
                            {loading ? "Generating..." : "Generate Lease"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
