"use client";

/**
 * @page         PropertyBillingPage
 * @route        app/pages/landlord/properties/[id]/billing
 * @desc         Redesigned mobile-first billing dashboard for property-level billing.
 * @usedBy       Landlord → Property → Billing Module
 */

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
  CheckCircle,
  AlertCircle,
  FileText,
  Edit,
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
        const response = await axios.get(
          "/api/propertyListing/getPropDetailsById",
          {
            params: { property_id },
          }
        );
        setPropertyDetails(response.data.property);
      } catch (error) {
        console.error("Failed to fetch property details:", error);
      }
    }

    async function fetchBillingData() {
      try {
        const response = await axios.get(
          `/api/landlord/billing/checkPropertyBillingStats`,
          {
            params: { property_id },
          }
        );
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
    property_id
      ? `/api/landlord/billing/current?property_id=${property_id}`
      : null,
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

            // 🔥 Instantly update local state
            setBillingData(updatedBillingData);
            setHasBillingForMonth(true);
            Swal.fire("Success", data.message || "Billing saved successfully.", "success");
        } catch (error) {
            console.error("Billing save error:", error);
            Swal.fire("Error", "Failed to save billing. Please try again.", "error");
        }
    };

  const handleDownloadSummary = () => {
    window.open(
      `/api/landlord/billing/downloadSummary?property_id=${property_id}`,
      "_blank"
    );
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "overdue":
        return "bg-red-50 text-red-700 border-red-200";
      case "unpaid":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <ReceiptText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Property Billing
                </h1>
                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                  Manage property-level bills, generate invoices, and download
                  summaries
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {propertyDetails?.water_billing_type === "submetered" ||
              propertyDetails?.electricity_billing_type === "submetered" ? (
                <>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
                  >
                    <Zap className="w-4 h-4" />
                    Set Rates
                  </button>
                  <button
                    onClick={handleDownloadSummary}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Summary
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDownloadSummary}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Summary
                </button>
              )}
            </div>
          </div>

          {/* Rate Status Indicator */}
          {propertyDetails && (
            <div
              className={`rounded-lg border-l-4 p-4 ${
                hasBillingForMonth
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-amber-500 bg-amber-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {hasBillingForMonth ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      hasBillingForMonth ? "text-emerald-900" : "text-amber-900"
                    }`}
                  >
                    {hasBillingForMonth
                      ? "Submeter Utility Rates Set"
                      : "Rates Not Set"}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      hasBillingForMonth ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {hasBillingForMonth
                      ? `Rates configured for ${
                          billingData?.billing_period
                            ? new Date(
                                billingData.billing_period
                              ).toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                              })
                            : "this month"
                        }`
                      : "Configure rates to enable this month's billing"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Auto-Billing Notice */}
          {propertyDetails?.water_billing_type !== "submetered" &&
            propertyDetails?.electricity_billing_type !== "submetered" && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Auto-Billing Enabled
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Monthly invoices are automatically generated for
                      non-submetered units
                    </p>
                  </div>
                </div>
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
              onBillingUpdated={(updatedData) => {
                  setBillingData(updatedData);
                  setHasBillingForMonth(true);
              }}
          />


          {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3 mb-6">
          {loadingBills ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-lg h-32 w-full"
                ></div>
              ))}
            </div>
          ) : bills.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-900 font-semibold text-base mb-1">
                No Active Units
              </p>
              <p className="text-gray-500 text-sm">
                No active units found for billing this month
              </p>
            </div>
          ) : (
            bills.map((bill: any) => (
              <div
                key={bill.unit_id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 text-base truncate">
                          {bill.unit_name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {bill.tenant_name}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getStatusConfig(
                        bill.billing_status
                      )}`}
                    >
                      {bill.billing_status || "no_bill"}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Period:</span>
                      <span className="font-medium text-gray-900">
                        {bill.billing_period
                          ? new Date(bill.billing_period).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold text-gray-900">
                        ₱
                        {Number(bill.total_amount_due).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {(propertyDetails?.water_billing_type === "submetered" ||
                    propertyDetails?.electricity_billing_type ===
                      "submetered") && (
                    <button
                      onClick={() =>
                        router.push(
                          `/pages/landlord/properties/${property_id}/billing/createUnitBill/${bill.unit_id}`
                        )
                      }
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-white transition-all shadow-sm ${
                        bill.billing_status === "draft"
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                          : bill.billing_status === "no_bill"
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      }`}
                    >
                      {bill.billing_status === "draft" ? (
                        <>
                          <Edit className="w-4 h-4" />
                          Edit Bill
                        </>
                      ) : bill.billing_status === "no_bill" ? (
                        <>
                          <FileText className="w-4 h-4" />
                          Generate Bill
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          Review Bill
                        </>
                      )}
                    </button>
                  )}

                  {propertyDetails?.water_billing_type !== "submetered" &&
                    propertyDetails?.electricity_billing_type !==
                      "submetered" && (
                      <button
                        onClick={() =>
                          (window.location.href = `/pages/landlord/properties/${property_id}/billing/non-submetered/review/${bill.unit_id}`)
                        }
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
                      >
                        <FileText className="w-4 h-4" />
                        {bill?.billing_status === "no_bill"
                          ? "Generate Bill"
                          : "Review Bill"}
                      </button>
                    )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Billing Period
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loadingBills ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : bills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-gray-900 font-semibold text-lg mb-1">
                          No Active Units
                        </p>
                        <p className="text-gray-500 text-sm">
                          No active units found for billing this month
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bills.map((bill: any) => (
                    <tr
                      key={bill.unit_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-gray-900 text-sm">
                            {bill.unit_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {bill.tenant_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {bill.billing_period
                          ? new Date(bill.billing_period).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        ₱
                        {Number(bill.total_amount_due).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusConfig(
                            bill.billing_status
                          )}`}
                        >
                          {bill.billing_status || "no_bill"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {(propertyDetails?.water_billing_type ===
                            "submetered" ||
                            propertyDetails?.electricity_billing_type ===
                              "submetered") && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/pages/landlord/properties/${property_id}/billing/createUnitBill/${bill.unit_id}`
                                )
                              }
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${
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

                          {propertyDetails?.water_billing_type !==
                            "submetered" &&
                            propertyDetails?.electricity_billing_type !==
                              "submetered" && (
                              <button
                                onClick={() =>
                                  (window.location.href = `/pages/landlord/properties/${property_id}/billing/non-submetered/review/${bill.unit_id}`)
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                              >
                                {bill?.billing_status === "no_bill"
                                  ? "Generate Bill"
                                  : "Review Bill"}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
