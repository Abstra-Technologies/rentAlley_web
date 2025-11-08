"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    FileCog,
    CheckCircle2,
    ArrowLeft,
    Users,
    AlertTriangle,
} from "lucide-react";

export default function GenerateLease({ property_id, agreement_id, leaseDetails }: any) {
    const [step, setStep] = useState<1 | 2>(1);
    const [config, setConfig] = useState<any>(null);
    const [form, setForm] = useState({
        rent_amount: "",
        billing_due_day: "",
        grace_period_days: "",
        late_fee_amount: "",
    });
    const [rentChanged, setRentChanged] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [leaseFileUrl, setLeaseFileUrl] = useState<string>("");
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    // 🔹 Load Property Configuration (defaults)

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get(
                    `/api/landlord/properties/getPropertyConfigurations`,
                    { params: { property_id } }
                );
                const cfg = res.data?.config || {};
                setConfig(cfg);

                setForm((prev) => ({
                    ...prev,
                    rent_amount: leaseDetails?.rent_amount || "",
                    billing_due_day: cfg.billingDueDay || "",
                    grace_period_days: cfg.gracePeriodDays || "",
                    late_fee_amount: cfg.lateFeeAmount || "",
                }));
            } catch (error) {
                Swal.fire("Error", "Failed to load property configuration.", "error");
            }
        };
        fetchConfig();
    }, [property_id, leaseDetails]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [cooldown]);

    // 🔹 Handle form changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));

        if (name === "rent_amount" && value !== String(leaseDetails?.rent_amount)) {
            setRentChanged(true);
        } else if (name === "rent_amount" && value === String(leaseDetails?.rent_amount)) {
            setRentChanged(false);
        }
    };

    // 🔹 Generate Lease
    const handleGenerate = async () => {
        if (!form.attestation) {
            Swal.fire({
                title: "Missing Attestation",
                text: "Please attest that the information provided is true and correct before proceeding.",
                icon: "warning",
                confirmButtonColor: "#f59e0b",
            });
            return;
        }

        try {
            // ✅ Ensure valid start_date and end_date
            const startDate =
                form.start_date || leaseDetails?.start_date?.split("T")[0];
            const endDate = form.end_date || leaseDetails?.end_date?.split("T")[0];

            if (!startDate || !endDate) {
                Swal.fire({
                    title: "Missing Lease Dates",
                    text: "Please make sure both start and end dates are selected before generating the lease.",
                    icon: "error",
                    confirmButtonColor: "#dc2626",
                });
                return;
            }

            const payload = {
                agreement_id,
                property_id,
                lease_type: form.lease_type || "residential",
                start_date: startDate,
                end_date: endDate,
                rent_amount: form.rent_amount,
                security_deposit: form.security_deposit,
                advance_payment: form.advance_payment,
                billing_due_day: form.billing_due_day,
                grace_period_days: form.grace_period_days,
                late_fee_amount: form.late_fee_amount,
                rent_changed: rentChanged ? 1 : 0,
                allowed_occupants: form.allowed_occupants,
                notice_period: form.notice_period,
                maintenance_responsibility: form.maintenance_responsibility,
                pet_policy: form.pet_policy,
                smoking_policy: form.smoking_policy,
                utilities: form.utilities,
                furnishing_policy: form.furnishing_policy,
                termination_clause: form.termination_clause,
                entry_notice: form.entry_notice,
                attestation: form.attestation ? 1 : 0,
                landlord_id: leaseDetails?.landlord_id,
                tenant_id: leaseDetails?.tenant_id,
                unit_id: leaseDetails?.unit_id,
                property_name: leaseDetails?.property_name,
                unit_name: leaseDetails?.unit_name,
            };

            const res = await axios.post(`/api/landlord/activeLease/generateLease`, payload);
            const unencryptedUrl = res.data?.unencrypted_url;

            if (res.data?.success && unencryptedUrl) {
                setLeaseFileUrl(unencryptedUrl);
                Swal.fire({
                    title: "Lease Generated!",
                    html: `
          <div class="text-sm text-gray-700 mt-2">
            Lease for <strong>${leaseDetails?.tenant_name}</strong> at <strong>${leaseDetails?.property_name}</strong>
            has been successfully generated.
          </div>
        `,
                    icon: "success",
                    confirmButtonColor: "#059669",
                });
                setStep(4);
            } else {
                Swal.fire({
                    title: "Lease Generated",
                    text: "Lease contract created successfully!",
                    icon: "success",
                    confirmButtonColor: "#059669",
                });
                setStep(4);
            }
        } catch (error: any) {
            console.error("Error generating lease:", error);
            Swal.fire("Error", "Failed to generate lease contract.", "error");
        }
    };

    const handleSendOtp = async () => {
        try {
            await axios.post("/api/landlord/activeLease/sendOtp", {
                agreement_id,
                role: "landlord",
                email: leaseDetails?.landlord_email,
            });
            setOtpSent(true);
            Swal.fire("OTP Sent!", "Check your email for the 6-digit code.", "success");
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.error || "Failed to send OTP.", "error");
        }
    };

    const handleVerifyOtp = async (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        e?.stopPropagation();

        try {
            const payload = {
                agreement_id,
                email: leaseDetails?.landlord_email,
                role: "landlord",
                otp_code: otpCode,
            };

            const res = await axios.post("/api/landlord/activeLease/veritfyOtp", payload);

            if (res.data?.success) {
                Swal.fire({
                    title: "OTP Verified!",
                    text: "Lease successfully signed and verified.",
                    icon: "success",
                    confirmButtonColor: "#059669",
                });
                setStep(5);
            } else {
                Swal.fire("Error", res.data?.error || "Invalid OTP.", "error");
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
            Swal.fire("Error", "Failed to verify OTP.", "error");
        }
    };

    const handleResendOtp = async () => {
        if (cooldown > 0) return;

        try {
            setResending(true);
            const res = await axios.post(`/api/landlord/activeLease/sendOtp`, {
                agreement_id,
                role: "landlord", // or "tenant"
                email: leaseDetails?.landlord_email, // ensure you pass the registered email
            });

            if (res.data?.success) {
                Swal.fire({
                    title: "OTP Sent!",
                    text: "A new verification code has been sent to your registered email.",
                    icon: "success",
                    confirmButtonColor: "#059669",
                });
                setCooldown(60); // 60 seconds cooldown before resend
            } else {
                Swal.fire("Error", res.data?.error || "Failed to resend OTP.", "error");
            }
        } catch (error: any) {
            console.error("Resend OTP error:", error);
            Swal.fire("Error", "Could not resend OTP. Please try again.", "error");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">

            {step === 1 && (
                <>
                    {/* 🏷️ Header */}
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FileCog className="w-5 h-5 text-blue-600" />
                        Review & Set Contract Terms
                    </h2>

                    {/* 🆕 Lease Type Selection */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">Lease Type</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, lease_type: "residential" }))}
                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                                    form.lease_type === "residential"
                                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                        : "border-gray-200 bg-white hover:border-blue-300 text-gray-700"
                                }`}
                            >
                                🏠 Residential Lease
                            </button>

                            <button
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, lease_type: "commercial" }))}
                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                                    form.lease_type === "commercial"
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                                        : "border-gray-200 bg-white hover:border-emerald-300 text-gray-700"
                                }`}
                            >
                                🏢 Commercial Lease
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Residential = homes, condos, apartments. Commercial = offices, shops, business spaces.
                        </p>
                    </div>

                    {/* 🧩 Tenant and Landlord Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-6 border-b pb-4">
                        {/* Tenant Info */}
                        <div>
                            <h3 className="text-gray-800 font-semibold mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-600" /> Tenant Information
                            </h3>
                            <p><span className="font-medium text-gray-500">Name:</span> {leaseDetails?.tenant_name || "N/A"}</p>
                            <p><span className="font-medium text-gray-500">Email:</span> {leaseDetails?.tenant_email || "N/A"}</p>
                            <p><span className="font-medium text-gray-500">Phone:</span> {leaseDetails?.tenant_phone || "N/A"}</p>
                            <p><span className="font-medium text-gray-500">Address:</span> {leaseDetails?.tenant_address || "N/A"}</p>
                            <p><span className="font-medium text-gray-500">Citizenship:</span> {leaseDetails?.tenant_citizenship || "N/A"}</p>
                            <p><span className="font-medium text-gray-500">Civil Status:</span> {leaseDetails?.tenant_civil_status || "N/A"}</p>

                            {/* Age (calculated if tenant_birthdate available) */}
                            {leaseDetails?.tenant_birthdate && (
                                <p>
                                    <span className="font-medium text-gray-500">Age:</span>{" "}
                                    {Math.floor(
                                        (new Date().getTime() - new Date(leaseDetails.tenant_birthdate).getTime()) /
                                        (1000 * 60 * 60 * 24 * 365.25)
                                    )}{" "}
                                    years old
                                </p>
                            )}
                        </div>

                        {/* Landlord Info */}
                        <div>
                            <h3 className="text-gray-800 font-semibold mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" /> Landlord Information
                            </h3>
                            <p><span className="font-medium text-gray-500">Name:</span> {leaseDetails?.landlord_name || "N/A"}</p>
                            <p><span className="font-medium text-gray-500">Email:</span> {leaseDetails?.landlord_email || "N/A"}</p>
                            <p><span className="font-medium text-gray-500">Phone:</span> {leaseDetails?.landlord_phone || "N/A"}</p>
                            <p><span className="font-medium text-gray-500">Address:</span> {leaseDetails?.landlord_address || "N/A"}</p>
                            <p><span className="font-medium text-gray-500">Citizenship:</span> {leaseDetails?.landlord_citizenship || "N/A"}</p>
                            <p><span className="font-medium text-gray-500">Civil Status:</span> {leaseDetails?.landlord_civil_status || "N/A"}</p>

                            {leaseDetails?.landlord_birthdate && (
                                <p>
                                    <span className="font-medium text-gray-500">Age:</span>{" "}
                                    {Math.floor(
                                        (new Date().getTime() - new Date(leaseDetails.landlord_birthdate).getTime()) /
                                        (1000 * 60 * 60 * 24 * 365.25)
                                    )}{" "}
                                    years old
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ⚠️ Smart Change Warning */}
                    {(rentChanged ||
                        form.billing_due_day !== String(config?.billingDueDay || "") ||
                        form.grace_period_days !== String(config?.gracePeriodDays || "") ||
                        form.late_fee_amount !== String(config?.lateFeeAmount || "") ||
                        (leaseDetails?.start_date && form.start_date && form.start_date !== leaseDetails.start_date.split("T")[0]) ||
                        (leaseDetails?.end_date && form.end_date && form.end_date !== leaseDetails.end_date.split("T")[0])
                    ) && (
                        <div className="mb-5 flex items-start gap-2 bg-yellow-50 border border-yellow-300 text-yellow-700 p-3 rounded-lg text-sm">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
          You’ve modified one or more contract settings (rent, due date, grace period, late fee, or lease duration).
          These changes will also update the property, unit, and lease configurations accordingly.
        </span>
                        </div>
                    )}

                    {/* ⚙️ Contract Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {/* Start Date */}
                        <label className="flex flex-col">
                            <span className="block text-gray-600 mb-1 font-medium">Start Date</span>
                            <input
                                type="date"
                                name="start_date"
                                value={form.start_date || leaseDetails?.start_date?.split("T")[0] || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </label>

                        {/* End Date */}
                        <label className="flex flex-col">
                            <span className="block text-gray-600 mb-1 font-medium">End Date</span>
                            <input
                                type="date"
                                name="end_date"
                                value={form.end_date || leaseDetails?.end_date?.split("T")[0] || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </label>

                        {/* Monthly Rent */}
                        <label className="flex flex-col">
                            <span className="block text-gray-600 mb-1 font-medium">Monthly Rent (₱)</span>
                            <input
                                type="number"
                                name="rent_amount"
                                value={form.rent_amount}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                            {rentChanged && (
                                <span className="text-xs text-yellow-600 mt-1">
            ⚠️ You modified the default rent. This will be saved to the lease and update the unit record.
          </span>
                            )}
                        </label>

                        {/* Security Deposit */}
                        <label className="flex flex-col">
                            <span className="block text-gray-600 mb-1 font-medium">Security Deposit (₱)</span>
                            <input
                                type="number"
                                name="security_deposit"
                                value={form.security_deposit || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </label>

                        {/* Advance Payment */}
                        <label className="flex flex-col">
                            <span className="block text-gray-600 mb-1 font-medium">Advance Payment (₱)</span>
                            <input
                                type="number"
                                name="advance_payment"
                                value={form.advance_payment || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </label>

                        {/* Billing Due Day */}
                        <label className="flex flex-col">
                            <span className="block text-gray-600 mb-1 font-medium">Billing Due Day</span>
                            <input
                                type="number"
                                name="billing_due_day"
                                value={form.billing_due_day}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </label>

                        {/* Grace Period */}
                        <label className="flex flex-col">
                            <span className="block text-gray-600 mb-1 font-medium">Grace Period (Days)</span>
                            <input
                                type="number"
                                name="grace_period_days"
                                value={form.grace_period_days}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </label>

                        {/* Late Fee */}
                        <label className="flex flex-col">
                            <span className="block text-gray-600 mb-1 font-medium">Late Fee (₱)</span>
                            <input
                                type="number"
                                name="late_fee_amount"
                                value={form.late_fee_amount}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                        </label>
                    </div>

                    {/* Continue Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setStep(2)}
                            disabled={!form.lease_type}
                            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white transition ${
                                form.lease_type
                                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                                    : "bg-gray-300 cursor-not-allowed"
                            }`}
                        >
                            Continue →
                        </button>
                    </div>
                </>
            )}


            {step === 2 && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 max-w-3xl mx-auto">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        Additional Lease Details
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        These terms aren’t stored in the database but will appear in the final lease
                        document. Choose or confirm the most accurate options below.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {/* Allowed Occupants */}
                        <label className="flex flex-col">
                            <span className="block text-gray-600 mb-1 font-medium">Allowed Occupants</span>
                            <select
                                name="allowed_occupants"
                                value={form.allowed_occupants || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option value="">Select number...</option>
                                <option value="1">1 person</option>
                                <option value="2">Up to 2 persons</option>
                                <option value="3">Up to 3 persons</option>
                                <option value="4">Up to 4 persons</option>
                                <option value="5+">5 or more persons (by approval)</option>
                            </select>
                        </label>

                        {/* Notice Period */}
                        <label className="flex flex-col">
                            <span className="block text-gray-600 mb-1 font-medium">Termination Notice Period</span>
                            <select
                                name="notice_period"
                                value={form.notice_period || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option value="">Select period...</option>
                                <option value="15">15 days notice</option>
                                <option value="30">30 days notice (standard)</option>
                                <option value="45">45 days notice</option>
                                <option value="60">60 days notice</option>
                            </select>
                        </label>

                        {/* Maintenance Responsibility */}
                        <label className="flex flex-col sm:col-span-2">
                            <span className="block text-gray-600 mb-1 font-medium">Maintenance Responsibility</span>
                            <select
                                name="maintenance_responsibility"
                                value={form.maintenance_responsibility || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option value="">Select responsibility...</option>
                                <option value="tenant_minor_landlord_major">
                                    Tenant handles minor repairs; landlord handles major maintenance
                                </option>
                                <option value="landlord_all">Landlord responsible for all repairs and maintenance</option>
                                <option value="tenant_all">Tenant responsible for all maintenance and upkeep</option>
                            </select>
                        </label>

                        {/* Pet Policy */}
                        <label className="flex flex-col sm:col-span-2">
                            <span className="block text-gray-600 mb-1 font-medium">Pet Policy</span>
                            <select
                                name="pet_policy"
                                value={form.pet_policy || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option value="">Select policy...</option>
                                <option value="no_pets">No pets allowed within the premises</option>
                                <option value="small_pets_allowed">
                                    Small pets allowed with landlord approval and deposit
                                </option>
                                <option value="pets_allowed">
                                    Pets allowed without restriction (tenant liable for damages)
                                </option>
                            </select>
                        </label>

                        {/* Smoking Policy */}
                        <label className="flex flex-col sm:col-span-2">
                            <span className="block text-gray-600 mb-1 font-medium">Smoking Policy</span>
                            <select
                                name="smoking_policy"
                                value={form.smoking_policy || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option value="">Select policy...</option>
                                <option value="no_smoking">Smoking strictly prohibited inside unit</option>
                                <option value="designated_area">Allowed only in designated areas</option>
                                <option value="smoking_allowed">Smoking permitted within reasonable limits</option>
                            </select>
                        </label>

                        {/* Utilities */}
                        <label className="flex flex-col sm:col-span-2">
                            <span className="block text-gray-600 mb-1 font-medium">Utilities Responsibility</span>
                            <select
                                name="utilities"
                                value={form.utilities || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option value="">Select responsibility...</option>
                                <option value="tenant">Tenant pays for electricity and water</option>
                                <option value="landlord">Landlord covers utilities in monthly rent</option>
                                <option value="shared">Utilities shared based on meter or usage</option>
                            </select>
                        </label>

                        {/* Furnishing */}
                        <label className="flex flex-col sm:col-span-2">
                            <span className="block text-gray-600 mb-1 font-medium">Furnishing Responsibility</span>
                            <select
                                name="furnishing_policy"
                                value={form.furnishing_policy || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option value="">Select policy...</option>
                                <option value="provided">Fully furnished – as listed in inventory</option>
                                <option value="partial">Partially furnished – tenant may add items</option>
                                <option value="unfurnished">Unfurnished – tenant provides furniture</option>
                            </select>
                        </label>

                        {/* 🆕 Termination Clause */}
                        <label className="flex flex-col sm:col-span-2">
                            <span className="block text-gray-600 mb-1 font-medium">Termination Clause</span>
                            <select
                                name="termination_clause"
                                value={form.termination_clause || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option value="">Select clause...</option>
                                <option value="non_payment">Lease may be terminated due to non-payment or breach of terms</option>
                                <option value="mutual">Lease may end by mutual agreement of both parties</option>
                                <option value="fixed_term">Fixed-term lease; terminates automatically at end date</option>
                                <option value="violation">Immediate termination if property is misused or damaged</option>
                            </select>
                        </label>

                        {/* 🆕 Entry & Notice Requirement */}
                        <label className="flex flex-col sm:col-span-2">
        <span className="block text-gray-600 mb-1 font-medium">
          Landlord Entry & Notice Requirement
        </span>
                            <select
                                name="entry_notice"
                                value={form.entry_notice || ""}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option value="">Select requirement...</option>
                                <option value="24hr_notice">
                                    Landlord must provide at least 24-hour notice before entry (for inspection or repair)
                                </option>
                                <option value="48hr_notice">
                                    Landlord must provide at least 48-hour written notice
                                </option>
                                <option value="emergency_entry">
                                    Immediate entry allowed only in case of emergency or property damage
                                </option>
                                <option value="scheduled_entry">
                                    Entry only by scheduled appointment with tenant consent
                                </option>
                            </select>
                        </label>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                        <button
                            onClick={() => setStep(1)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-gray-600 hover:text-blue-600 transition text-sm font-medium border border-gray-300 rounded-lg"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>

                        <button
                            onClick={() => setStep(3)}
                            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-lg shadow hover:from-blue-700 hover:to-emerald-700 transition"
                        >
                            Continue →
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 max-w-3xl mx-auto">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        Review & Confirm Lease Details
                    </h2>

                    {/* ⚠️ Warning */}
                    <div className="mb-5 flex items-start gap-2 bg-yellow-50 border border-yellow-300 text-yellow-700 p-3 rounded-lg text-sm">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
        Please review all details carefully before generating the lease.{" "}
                            <strong>Once confirmed, these details cannot be modified</strong> without creating a new lease record.
      </span>
                    </div>

                    {/* Lease Agreement Details */}
                    <h3 className="font-semibold text-gray-800 text-base mb-2 border-b pb-1">
                        Lease Agreement Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 mb-6">
                        {form?.lease_type && (
                            <p><strong>Lease Type:</strong> {form.lease_type === "commercial" ? "Commercial" : "Residential"}</p>
                        )}
                        {leaseDetails?.property_name && (
                            <p><strong>Property:</strong> {leaseDetails.property_name}</p>
                        )}
                        {leaseDetails?.unit_name && (
                            <p><strong>Unit:</strong> {leaseDetails.unit_name}</p>
                        )}

                        <p><strong>Start Date:</strong> {form.start_date || leaseDetails?.start_date?.split("T")[0] || "—"}</p>
                        <p><strong>End Date:</strong> {form.end_date || leaseDetails?.end_date?.split("T")[0] || "—"}</p>

                        <p><strong>Monthly Rent:</strong> ₱{Number(form.rent_amount || 0).toLocaleString()}</p>
                        <p><strong>Security Deposit:</strong> ₱{Number(form.security_deposit || 0).toLocaleString()}</p>
                        <p><strong>Advance Payment:</strong> ₱{Number(form.advance_payment || 0).toLocaleString()}</p>

                        <p><strong>Billing Due Day:</strong> {form.billing_due_day || "—"}</p>
                        <p><strong>Grace Period:</strong> {form.grace_period_days || "—"} days</p>
                        <p><strong>Late Fee:</strong> ₱{Number(form.late_fee_amount || 0).toLocaleString()}</p>

                        {rentChanged && (
                            <div className="sm:col-span-2 flex items-start gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-md text-xs">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                <span>
            The rent amount differs from the default unit rent. The new rent will update both the unit and this lease record.
          </span>
                            </div>
                        )}
                    </div>

                    {/* Parties Involved */}
                    <h3 className="font-semibold text-gray-800 text-base mb-2 border-b pb-1">Parties Involved</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 mb-6">
                        {/* Tenant */}
                        <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-4">
                            <p className="font-semibold text-emerald-700 mb-1">Tenant Information</p>
                            <p><strong>Name:</strong> {leaseDetails?.tenant_name || "N/A"}</p>
                            <p><strong>Email:</strong> {leaseDetails?.tenant_email || "N/A"}</p>
                            <p><strong>Phone:</strong> {leaseDetails?.tenant_phone || "N/A"}</p>
                            <p><strong>Address:</strong> {leaseDetails?.tenant_address || "N/A"}</p>
                            <p><strong>Citizenship:</strong> {leaseDetails?.tenant_citizenship || "N/A"}</p>
                            <p><strong>Occupation:</strong> {leaseDetails?.tenant_occupation || "N/A"}</p>
                            <p><strong>Civil Status:</strong> {leaseDetails?.tenant_civil_status || "N/A"}</p>
                            <p>
                                <strong>Age:</strong>{" "}
                                {leaseDetails?.tenant_age
                                    ? `${leaseDetails.tenant_age} years old`
                                    : leaseDetails?.tenant_birthdate
                                        ? (() => {
                                            const diff = Date.now() - new Date(leaseDetails.tenant_birthdate).getTime();
                                            return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} years old`;
                                        })()
                                        : "—"}
                            </p>
                        </div>

                        {/* Landlord */}
                        <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-4">
                            <p className="font-semibold text-blue-700 mb-1">Landlord Information</p>
                            <p><strong>Name:</strong> {leaseDetails?.landlord_name || "N/A"}</p>
                            <p><strong>Email:</strong> {leaseDetails?.landlord_email || "N/A"}</p>
                            <p><strong>Phone:</strong> {leaseDetails?.landlord_phone || "N/A"}</p>
                            <p><strong>Address:</strong> {leaseDetails?.landlord_address || "N/A"}</p>
                            <p><strong>Citizenship:</strong> {leaseDetails?.landlord_citizenship || "N/A"}</p>
                            <p><strong>Occupation:</strong> {leaseDetails?.landlord_occupation || "N/A"}</p>
                            <p><strong>Civil Status:</strong> {leaseDetails?.landlord_civil_status || "N/A"}</p>
                            <p>
                                <strong>Age:</strong>{" "}
                                {leaseDetails?.landlord_age
                                    ? `${leaseDetails.landlord_age} years old`
                                    : leaseDetails?.landlord_birthdate
                                        ? (() => {
                                            const diff = Date.now() - new Date(leaseDetails.landlord_birthdate).getTime();
                                            return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} years old`;
                                        })()
                                        : "—"}
                            </p>
                        </div>
                    </div>

                    {/* Additional Lease Policies */}
                    <h3 className="font-semibold text-gray-800 text-base mb-2 border-b pb-1">
                        Additional Lease Policies
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700 mb-6">
                        <p><strong>Allowed Occupants:</strong> {form.allowed_occupants || "—"}</p>
                        <p><strong>Notice Period:</strong> {form.notice_period ? `${form.notice_period} days` : "—"}</p>

                        <p className="sm:col-span-2">
                            <strong>Maintenance Responsibility:</strong>{" "}
                            {form.maintenance_responsibility
                                ? form.maintenance_responsibility === "tenant_minor_landlord_major"
                                    ? "Tenant handles minor repairs; landlord handles major maintenance"
                                    : form.maintenance_responsibility === "landlord_all"
                                        ? "Landlord responsible for all repairs and maintenance"
                                        : "Tenant responsible for all maintenance and upkeep"
                                : "—"}
                        </p>

                        <p className="sm:col-span-2">
                            <strong>Pet Policy:</strong>{" "}
                            {form.pet_policy
                                ? form.pet_policy === "no_pets"
                                    ? "No pets allowed within the premises"
                                    : form.pet_policy === "small_pets_allowed"
                                        ? "Small pets allowed with landlord approval"
                                        : "Pets allowed without restriction (tenant liable for damages)"
                                : "—"}
                        </p>

                        <p className="sm:col-span-2">
                            <strong>Smoking Policy:</strong>{" "}
                            {form.smoking_policy
                                ? form.smoking_policy === "no_smoking"
                                    ? "Smoking strictly prohibited inside unit"
                                    : form.smoking_policy === "designated_area"
                                        ? "Allowed only in designated areas"
                                        : "Smoking permitted within reasonable limits"
                                : "—"}
                        </p>

                        <p className="sm:col-span-2">
                            <strong>Utilities Responsibility:</strong>{" "}
                            {form.utilities
                                ? form.utilities === "tenant"
                                    ? "Tenant pays for utilities"
                                    : form.utilities === "landlord"
                                        ? "Landlord covers utilities in monthly rent"
                                        : "Utilities shared based on meter or usage"
                                : "—"}
                        </p>

                        <p className="sm:col-span-2">
                            <strong>Furnishing:</strong>{" "}
                            {form.furnishing_policy
                                ? form.furnishing_policy === "provided"
                                    ? "Fully furnished – as listed in inventory"
                                    : form.furnishing_policy === "partial"
                                        ? "Partially furnished – tenant may add items"
                                        : "Unfurnished – tenant provides furniture"
                                : "—"}
                        </p>

                        <p className="sm:col-span-2">
                            <strong>Termination Clause:</strong>{" "}
                            {form.termination_clause
                                ? form.termination_clause === "non_payment"
                                    ? "Lease may be terminated due to non-payment or breach of terms"
                                    : form.termination_clause === "mutual"
                                        ? "Lease may end by mutual agreement of both parties"
                                        : form.termination_clause === "fixed_term"
                                            ? "Fixed-term lease; terminates automatically at end date"
                                            : "Immediate termination if property is misused or damaged"
                                : "—"}
                        </p>

                        <p className="sm:col-span-2">
                            <strong>Landlord Entry & Notice Requirement:</strong>{" "}
                            {form.entry_notice
                                ? form.entry_notice === "24hr_notice"
                                    ? "Landlord must provide at least 24-hour notice before entry (inspection/repair)"
                                    : form.entry_notice === "48hr_notice"
                                        ? "Landlord must provide at least 48-hour written notice"
                                        : form.entry_notice === "emergency_entry"
                                            ? "Immediate entry allowed only in case of emergency"
                                            : "Entry only by scheduled appointment with tenant consent"
                                : "—"}
                        </p>
                    </div>

                    {/* ✅ Attestation */}
                    <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm text-gray-700 mb-6">
                        <input
                            id="attest"
                            type="checkbox"
                            checked={form.attestation || false}
                            onChange={(e) => setForm((prev: any) => ({ ...prev, attestation: e.target.checked }))}
                            className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="attest" className="cursor-pointer select-none">
                            I hereby attest that all details provided above are true and correct to the best of my knowledge.
                            I understand that once generated, this lease agreement becomes a binding digital record under the UpKyp platform.
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                        <button
                            onClick={() => setStep(2)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-gray-600 hover:text-blue-600 transition text-sm font-medium border border-gray-300 rounded-lg"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>

                        <button
                            onClick={handleGenerate}
                            disabled={!form.attestation}
                            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white transition ${
                                form.attestation
                                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                                    : "bg-gray-300 cursor-not-allowed"
                            }`}
                        >
                            Confirm & Generate Lease
                        </button>
                    </div>
                </div>
            )}


            {step === 4 && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 max-w-2xl mx-auto text-center">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        Lease Document Ready for Signing
                    </h2>

                    {/* 📄 Lease Link */}
                    <div className="mb-5 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-left">
                        <p className="text-gray-600 mb-2">Your lease document has been generated and stored securely.</p>
                        <p className="break-all text-blue-600 font-medium">
                            <a
                                href={leaseFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                            >
                                {leaseFileUrl}
                            </a>
                        </p>
                    </div>

                    {!otpSent ? (
                        <>
                            <p className="text-sm text-gray-700 mb-5">
                                To digitally sign and verify this lease, please authenticate using a one-time password (OTP)
                                sent to <strong>{leaseDetails?.landlord_email}</strong>.
                            </p>
                            <button
                                onClick={handleSendOtp}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-lg shadow hover:from-blue-700 hover:to-emerald-700 transition"
                            >
                                Authenticate Document
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-700 mb-4">
                                A 6-digit code was sent to <strong>{leaseDetails?.landlord_email}</strong>.
                                Enter it below to confirm your digital signature.
                            </p>

                            <input
                                type="text"
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                className="w-48 mx-auto text-center text-2xl tracking-widest border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••"
                            />

                            <div className="flex flex-col sm:flex-row justify-center gap-3">
                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={otpCode.length !== 6}
                                    className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white transition ${
                                        otpCode.length === 6
                                            ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                                            : "bg-gray-300 cursor-not-allowed"
                                    }`}
                                >
                                    Verify & Sign
                                </button>

                                <button
                                    onClick={handleResendOtp}
                                    className="text-sm text-blue-600 hover:underline mt-2 sm:mt-0"
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* STEP 5 - Success Confirmation */}
            {step === 5 && (
                <div className="text-center p-6 max-w-lg mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                        Lease Successfully Signed!
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Your digital signature has been verified and recorded. You may now download or review your signed lease document.
                    </p>
                    <a
                        href={leaseFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700"
                    >
                        View Signed Lease Document
                    </a>
                </div>
            )}

        </div>
    );
}
