"use client";

/**
 * @page         PropertyBillingPage
 * @route        app/pages/landlord/properties/[id]/billing
 * @desc         Redesigned mobile-first billing dashboard for property-level billing.
 * @usedBy       Landlord → Property → Billing Module
 */

import { BackButton } from "@/components/navigation/backButton";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import axios from "axios";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
    ReceiptText,
    Building2,
    Download,
    Zap,
    Droplet,
} from "lucide-react";
import PropertyRatesModal from "@/components/landlord/properties/utilityRatesSetter";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PropertyBillingPage() {
    const { id } = useParams();
    const property_id = id as string;
    const router = useRouter();

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

    const { data: billsData, isLoading: loadingBills } = useSWR(
        property_id ? `/api/landlord/billing/current?property_id=${property_id}` : null,
        fetcher
    );
    const bills = billsData?.bills || [];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBillingForm({ ...billingForm, [name]: value });
    };

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

            setBillingData(updatedBillingData);
            setHasBillingForMonth(true);
            setIsModalOpen(true);
            mutate(`/api/landlord/billing/current?property_id=${property_id}`);
        } catch (error) {
            console.error("Billing save error:", error);
            Swal.fire("Error", "Failed to save billing. Please try again.", "error");
        }
    };

    const handleDownloadSummary = () => {
        window.open(`/api/landlord/billing/downloadSummary?property_id=${property_id}`, "_blank");
    };


    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-3 py-4 sm:p-6">

            {/* Main Wrapper */}
            <div className="max-w-[95%] lg:max-w-[1600px] xl:max-w-[1800px] mx-auto bg-white border border-gray-100 rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 space-y-8">

                {/* Header */}
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    {/* Left Section: Icon + Title + Description */}
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 shadow-sm flex-shrink-0">
                            <ReceiptText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                                Property Billing
                            </h1>
                            <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                                Manage and review all property-level bills. Generate submetered invoices, check auto-generated bills, and download summaries.
                            </p>
                        </div>
                    </div>

                    {/* Right Section: Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2 sm:mt-0">
                        {propertyDetails?.water_billing_type === "submetered" ||
                        propertyDetails?.electricity_billing_type === "submetered" ? (
                            <>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    <Zap className="w-4 h-4" /> Set Rates
                                </button>
                                <button
                                    onClick={handleDownloadSummary}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    <Download className="w-4 h-4" /> Summary
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleDownloadSummary}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Download className="w-4 h-4" /> Summary
                            </button>
                        )}
                    </div>
                </div>

                {/* 🔹 Persistent Rate Status Indicator */}
                {propertyDetails && (
                    <div
                        className={`mt-4 w-full rounded-xl border-l-4 p-3 sm:p-4 text-sm sm:text-base font-medium flex items-center gap-2 shadow-sm ${
                            hasBillingForMonth
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-yellow-400 bg-yellow-50 text-yellow-700"
                        }`}
                    >
                        {hasBillingForMonth ? (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-green-600 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>
          <strong>Submeter Utility Rates is already set for the month :</strong>{" "}
                                    {billingData?.billing_period
                                        ? new Date(billingData.billing_period).toLocaleDateString("en-US", {
                                            month: "long",
                                            year: "numeric",
                                        })
                                        : "This month"}
        </span>
                            </>
                        ) : (
                            <>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-yellow-600 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>
          <strong>Rates not set:</strong> Configure rates to enable this month’s billing.
        </span>
                            </>
                        )}
                    </div>
                )}

                {/* Auto-Billing Notice */}
                {propertyDetails?.water_billing_type !== "submetered" &&
                    propertyDetails?.electricity_billing_type !== "submetered" && (
                        <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm sm:text-base">
                            <b>Auto-Billing Enabled:</b> Monthly invoices are automatically generated for non-submetered units.
                        </div>
                    )}

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

                {/* Billing Table */}
                <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white w-full">
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
                                <th className="text-center py-3 px-4 font-semibold">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {bills.map((bill: any) => (
                                <tr key={bill.unit_id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 flex items-center gap-2 text-gray-800">
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
                                        ₱{Number(bill.total_amount_due).toLocaleString("en-PH", {
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
                                    <td className="py-3 px-4 flex flex-col sm:flex-row gap-2 justify-center">
                                        {/* Submetered */}
                                        {(propertyDetails?.water_billing_type === "submetered" ||
                                            propertyDetails?.electricity_billing_type === "submetered") && (
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/pages/landlord/properties/${property_id}/billing/createUnitBill/${bill.unit_id}`
                                                    )
                                                }
                                                className={`px-3 py-1.5 text-sm font-semibold rounded-lg text-white transition-all shadow-sm hover:shadow-md active:scale-95 ${
                                                    bill.billing_status === "draft"
                                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                                        : bill.billing_status === "no_bill"
                                                            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                                            : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                                }`}
                                            >
                                                {bill.billing_status === "draft"
                                                    ? "Edit Bill"
                                                    : bill.billing_status === "no_bill"
                                                        ? "Generate Bill"
                                                        : "Review Bill"}
                                            </button>
                                        )}

                                        {/* Non-Submetered */}
                                        {propertyDetails?.water_billing_type !== "submetered" &&
                                            propertyDetails?.electricity_billing_type !== "submetered" && (
                                                <button
                                                    onClick={() =>
                                                        (window.location.href = `/pages/landlord/properties/${property_id}/billing/non-submetered/review/${bill.unit_id}`)
                                                    }
                                                    className="px-3 py-1.5 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md active:scale-95"
                                                >
                                                    {bill?.billing_status === "no_bill"
                                                        ? "Generate Bill"
                                                        : "Review Bill"}
                                                </button>
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
