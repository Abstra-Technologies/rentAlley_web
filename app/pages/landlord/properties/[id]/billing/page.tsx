"use client";

/**
 * @page         PropertyBillingPage
 * @route        app/pages/landlord/properties/[id]/billing
 * @desc         Displays the list of all active units only for billing. Base on utiltiy types that it shows conditional rendering of action buttons.
 * @usedBy       Landlord → Property →  Billing Module
 */
import { BackButton } from "@/components/navigation/backButton";

import { useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import axios from "axios";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
    ReceiptText,
    Building2,
    CircleDollarSign,
    Loader2,
    Download,
    Settings2,
} from "lucide-react";
import PropertyRatesModal from "@/components/landlord/properties/utilityRatesSetter";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PropertyBillingPage() {
    const { id } = useParams();
    const property_id = id as string;
    const router = useRouter();

    const [isGenerating, setIsGenerating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [propertyDetails, setPropertyDetails] = useState<any>(null);
    const [billingForm, setBillingForm] = useState({
        billingPeriod: "",
        electricityConsumption: "",
        electricityTotal: "",
        waterConsumption: "",
        waterTotal: "",
    });
    const [billingData, setBillingData] = useState<any>(null);
    const [hasBillingForMonth, setHasBillingForMonth] = useState(false);

    // 🔹 Fetch property details (for determining billing type)
    useEffect(() => {
        async function fetchPropertyDetails() {
            try {
                const response = await axios.get("/api/propertyListing/getPropDetailsById", {
                    params: { property_id },
                });
                setPropertyDetails(response.data.property);
            } catch (error) {
                console.error("Failed to fetch property details:", error);
            }
        }

        async function fetchBillingData() {
            try {
                const response = await axios.get(`/api/landlord/billing/checkPropertyBillingStats`, {
                    params: { property_id },
                });

                if (response.data.billingData) {
                    const data = response.data.billingData;
                    setBillingData(data);
                    setHasBillingForMonth(true);
                    setBillingForm({
                        billingPeriod: data.billing_period || "",
                        electricityTotal: data.electricity?.total || "",
                        electricityConsumption: data.electricity?.consumption || "",
                        waterTotal: data.water?.total || "",
                        waterConsumption: data.water?.consumption || "",
                    });
                } else {
                    setBillingData(null);
                    setHasBillingForMonth(false);
                }
            } catch (err) {
                console.error("Failed to fetch billing data:", err);
            }
        }

        fetchPropertyDetails();
        fetchBillingData();
    }, [property_id]);

    // 🔹 Always fetch active leases with or without billing
    const { data: billsData, isLoading: loadingBills } = useSWR(
        property_id ? `/api/landlord/billing/current?property_id=${property_id}` : null,
        fetcher
    );


    const bills = billsData?.bills || [];

    // 🔹 Handle Input for Billing Form
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBillingForm({ ...billingForm, [name]: value });
    };

// 🔹 Save or Update Billing Rates (fully fixed)
    const handleSaveOrUpdateBilling = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = "/api/landlord/billing/savePropertyConcessionaireRates";

            const payload = {
                property_id,
                billingPeriod: billingForm.billingPeriod,
                electricityConsumption: parseFloat(billingForm.electricityConsumption) || 0,
                electricityTotal: parseFloat(billingForm.electricityTotal) || 0,
                waterConsumption: parseFloat(billingForm.waterConsumption) || 0,
                waterTotal: parseFloat(billingForm.waterTotal) || 0,
            };

            const { data } = await axios.post(url, payload);

            Swal.fire("Success", data.message || "Billing saved successfully.", "success");

            // ✅ Update displayed data instantly
            const updatedBillingData = {
                billing_period: payload.billingPeriod,
                electricity: {
                    consumption: payload.electricityConsumption,
                    total: payload.electricityTotal,
                },
                water: {
                    consumption: payload.waterConsumption,
                    total: payload.waterTotal,
                },
            };

            setBillingData(updatedBillingData); // <- re-renders modal immediately
            setHasBillingForMonth(true);
            setIsModalOpen(true); // keep open to see updates

            // ✅ Revalidate SWR for table data
            mutate(`/api/landlord/billing/current?property_id=${property_id}`);
        } catch (error) {
            console.error("Billing save error:", error);
            Swal.fire("Error", "Failed to save billing. Please try again.", "error");
        }
    };

    // 🔹 Download Billing Summary
    const handleDownloadSummary = () => {
        window.open(`/api/landlord/billing/downloadSummary?property_id=${property_id}`, "_blank");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
            {/* Wrapper container */}
            <div className="mx-auto max-w-9xl bg-white border border-gray-100 rounded-2xl shadow-lg p-5 sm:p-6 lg:p-8 space-y-8">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Left — Icon + Title */}
                    <div className="flex items-start sm:items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg shadow-sm flex-shrink-0">
                            <ReceiptText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 leading-snug">
                                Property Billing
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Manage and review all billings under this property.
                                Generate bills for submetered utilities, review auto-generated invoices for non-submetered units,
                                and download summaries for record-keeping.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ========================================================= */}
                {/* 💡 Unified Billing Controls */}
                {/* ========================================================= */}
                <div className="flex flex-col gap-4 bg-gradient-to-br from-gray-50 via-white to-blue-50/20 p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">

                    {/* ===== SUBMETERED PROPERTIES ===== */}
                    {(propertyDetails?.water_billing_type === "submetered" ||
                        propertyDetails?.electricity_billing_type === "submetered") && (
                        <>
                            {/* ⚙️ Set Property Rates */}
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center justify-center gap-2 w-full py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base text-white
                       bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700
                       active:scale-95 transition-all shadow-md hover:shadow-lg"
                            >
                                ⚙️ Set Property Rates
                            </button>

                            {/* 📄 Download Billing Summary */}
                            <button
                                onClick={handleDownloadSummary}
                                className="flex items-center justify-center gap-2 w-full py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base text-white
                       bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700
                       active:scale-95 transition-all shadow-md hover:shadow-lg"
                            >
                                📄 Download Billing Summary
                            </button>
                        </>
                    )}

                    {/* ===== NON-SUBMETERED PROPERTIES ===== */}
                    {propertyDetails?.water_billing_type !== "submetered" &&
                        propertyDetails?.electricity_billing_type !== "submetered" && (
                            <div className="space-y-4">
                                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm text-center sm:text-left">
                                    <span className="font-semibold">Auto-Billing:</span> Monthly billing is automatically generated for{" "}
                                    <b>non-submetered properties</b>.
                                </div>

                                {/* 📄 Download Billing Summary */}
                                <button
                                    onClick={handleDownloadSummary}
                                    className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base text-white
                         bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700
                         active:scale-95 transition-all shadow-md hover:shadow-lg"
                                >
                                    📄 Download Billing Summary
                                </button>
                            </div>
                        )}
                </div>

                {/* Property Rates Modal */}
                <PropertyRatesModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    billingData={billingData}
                    billingForm={billingForm}
                    propertyDetails={propertyDetails}
                    hasBillingForMonth={hasBillingForMonth}
                    handleInputChange={handleInputChange}
                    handleSaveOrUpdateBilling={handleSaveOrUpdateBilling}
                    onBillingUpdated={(updatedData) => setBillingData(updatedData)}
                />


                {/* ========================================================= */}
                {/* BILLING TABLE */}
                {/* ========================================================= */}
                {/* ========================================================= */}
                {/* BILLING TABLE — Always show active leases */}
                {/* ========================================================= */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                    {loadingBills ? (
                        <p className="text-gray-500 text-sm py-10 text-center animate-pulse">
                            Fetching billing records...
                        </p>
                    ) : bills.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-10">
                            No active units found for billing this month.
                        </div>
                    ) : (
                        <table className="min-w-full text-sm sm:text-base">
                            <thead className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold">Unit</th>
                                <th className="text-left py-3 px-4 font-semibold">Tenant</th>
                                <th className="text-left py-3 px-4 font-semibold">Billing Period</th>
                                <th className="text-left py-3 px-4 font-semibold">Amount</th>
                                <th className="text-left py-3 px-4 font-semibold">Status</th>
                                <th className="text-left py-3 px-4 font-semibold">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {bills.map((bill: any) => (
                                <tr
                                    key={bill.unit_id}
                                    className="border-b hover:bg-gray-50 transition-colors"
                                >
                                    <td className="py-3 px-4 text-gray-800 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-500" />
                                        {bill.unit_name}
                                    </td>

                                    <td className="py-3 px-4 text-gray-700">{bill.tenant_name}</td>

                                    <td className="py-3 px-4 text-gray-600">
                                        {bill.billing_period
                                            ? new Date(bill.billing_period).toLocaleDateString()
                                            : "—"}
                                    </td>

                                    <td className="py-3 px-4 text-gray-800 font-semibold">
                                        ₱
                                        {Number(bill.total_amount_due).toLocaleString("en-PH", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </td>

                                    <td className="py-3 px-4">
              <span
                  className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full ${
                      bill.billing_status === "paid"
                          ? "bg-green-100 text-green-700"
                          : bill.billing_status === "overdue"
                              ? "bg-red-100 text-red-700"
                              : bill.billing_status === "unpaid"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-600"
                  }`}
              >
                {bill.billing_status || "no_bill"}
              </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3 px-4 text-right">
                                        {/* ✅ Submetered Properties */}
                                        {(propertyDetails?.water_billing_type === "submetered" ||
                                            propertyDetails?.electricity_billing_type ===
                                            "submetered") && (
                                            <>
                                                {bill.billing_status === "draft" ||
                                                bill.billing_status === "unpaid" ||
                                                bill.billing_status === "paid" ? (
                                                    <button
                                                        onClick={() =>
                                                            router.push(
                                                                `/pages/landlord/properties/${property_id}/billing/createUnitBill/${bill.unit_id}`
                                                            )
                                                        }
                                                        className="px-3 py-1.5 text-sm font-semibold rounded-lg text-white
                        bg-gradient-to-r from-indigo-600 to-purple-600
                        hover:from-indigo-700 hover:to-purple-700
                        transition-all shadow-sm hover:shadow-md active:scale-95"
                                                    >
                                                        {bill.billing_status === "draft"
                                                            ? "Edit Bill"
                                                            : "Review Bill"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            router.push(
                                                                `/pages/landlord/properties/${property_id}/billing/createUnitBill/${bill.unit_id}`
                                                            )
                                                        }
                                                        className="px-3 py-1.5 text-sm font-semibold rounded-lg text-white
                        bg-gradient-to-r from-green-500 to-emerald-600
                        hover:from-green-600 hover:to-emerald-700
                        transition-all shadow-sm hover:shadow-md active:scale-95"
                                                    >
                                                        Generate Bill
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {/* ✅ Non-Submetered Properties */}
                                        {propertyDetails?.water_billing_type !== "submetered" &&
                                            propertyDetails?.electricity_billing_type !==
                                            "submetered" && (
                                                <>
                                                    {bill?.billing_status &&
                                                    bill.billing_status !== "no_bill" ? (
                                                        <button
                                                            onClick={() =>
                                                                (window.location.href = `/pages/landlord/properties/${property_id}/billing/non-submetered/review/${bill.unit_id}`)
                                                            }
                                                            className="px-3 py-1.5 text-sm font-semibold rounded-lg text-white
                          bg-gradient-to-r from-blue-600 to-emerald-600
                          hover:from-blue-700 hover:to-emerald-700
                          transition-all shadow-sm hover:shadow-md active:scale-95 w-full sm:w-auto"
                                                        >
                                                            Review Bill
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                (window.location.href = `/pages/landlord/properties/${property_id}/billing/non-submetered/review/${bill.unit_id}`)
                                                            }
                                                            className="px-3 py-1.5 text-sm font-semibold rounded-lg text-white
                          bg-gradient-to-r from-green-500 to-teal-600
                          hover:from-green-600 hover:to-teal-700
                          transition-all shadow-sm hover:shadow-md active:scale-95 w-full sm:w-auto"
                                                        >
                                                            Generate Bill
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </div>
    );


}
