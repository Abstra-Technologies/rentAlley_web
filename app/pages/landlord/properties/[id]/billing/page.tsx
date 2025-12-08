"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
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
  HelpCircle,
} from "lucide-react";
import PropertyRatesModal from "@/components/landlord/properties/utilityRatesSetter";
import PropertyUnitMeterList from "@/components/landlord/unitBilling/PropertyUnitMeterList";
import UnitMeterReadingsModal from "@/components/landlord/unitBilling/UnitMeterReadingsModal";
import { useOnboarding } from "@/hooks/useOnboarding";
import { propertyBillingSteps } from "@/lib/onboarding/propertyBilling";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PropertyBillingPage() {
  const { id } = useParams();
  const property_id = id as string;
  const router = useRouter();
  const [openMeterList, setOpenMeterList] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState<any>(null);
  const [billingForm, setBillingForm] = useState({
    billingPeriod: "",
    electricityConsumption: "",
    electricityTotal: "",
    waterConsumption: "",
    waterTotal: "",
    periodStart: "",
    periodEnd: "",
  });
  const [billingData, setBillingData] = useState<any>(null);
  const [hasBillingForMonth, setHasBillingForMonth] = useState(false);

  // New states for config-check
  const [configMissing, setConfigMissing] = useState(false);
  const [configModal, setConfigModal] = useState(false);

  // Initialize onboarding
  const { startTour } = useOnboarding({
    tourId: "property-billing",
    steps: propertyBillingSteps,
    autoStart: true, // Auto-start on first visit
  });

  useEffect(() => {
    if (!property_id) return;

    async function checkPropertyConfig() {
      try {
        const res = await axios.get("/api/properties/configuration", {
          params: { id: property_id },
        });

        // If PropertyConfiguration missing, backend returns {}
        if (!res.data || !res.data.billingDueDay) {
          setConfigMissing(true);
          setConfigModal(true);
        } else {
          setConfigMissing(false);
        }
      } catch (err) {
        console.error("Error checking property configuration:", err);
        // On failure → treat as missing so landlords can fix
        setConfigMissing(true);
        setConfigModal(true);
      }
    }

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

    // getting the utility rates if submetered
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
            periodStart: data.period_start || "",
            periodEnd: data.period_end || "",
          });
        } else {
          setBillingData(null);
          setHasBillingForMonth(false);
        }
      } catch (err) {
        console.error("Failed to fetch billing data:", err);
      }
    }

    checkPropertyConfig();
    fetchPropertyDetails();
    fetchBillingData();
    checkPropertyConfig();
  }, [property_id]);

  // getting active units with lease only.active or draft.
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

    if (configMissing) {
      Swal.fire(
        "Configuration Required",
        "Please complete the property configuration before saving billing rates.",
        "warning"
      );
      return;
    }

    try {
      const url = "/api/landlord/billing/savePropertyConcessionaireRates";

      const payload = {
        property_id,
        period_start: billingForm.periodStart,
        period_end: billingForm.periodEnd,
        electricityConsumption:
          parseFloat(billingForm.electricityConsumption) || 0,
        electricityTotal: parseFloat(billingForm.electricityTotal) || 0,
        waterConsumption: parseFloat(billingForm.waterConsumption) || 0,
        waterTotal: parseFloat(billingForm.waterTotal) || 0,
      };

      const { data } = await axios.post(url, payload);

      const updatedBillingData = {
        period_start: payload.period_start,
        period_end: payload.period_end,
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

      Swal.fire(
        "Success",
        data.message || "Billing saved successfully.",
        "success"
      );
    } catch (error) {
      console.error("Billing save error:", error);
      Swal.fire("Error", "Failed to save billing. Please try again.", "error");
    }
  };

  const handleDownloadSummary = () => {
    if (configMissing) {
      Swal.fire(
        "Configuration Required",
        "Please complete the property configuration before downloading summaries.",
        "warning"
      );
      return;
    }
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

  // helper to guard navigation actions that require configuration
  const guardActionWithConfig = (action: () => void) => {
    if (configMissing) {
      Swal.fire(
        "Configuration Required",
        "Please complete the property configuration before performing this action.",
        "warning"
      );
      return;
    }
    action();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* CONFIG REQUIRED MODAL */}
        {configModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-11/12 max-w-md p-6 rounded-xl shadow-xl">
              <h2 className="text-lg font-bold text-gray-900">
                Property Configuration Required
              </h2>

              <p className="text-sm text-gray-600 mt-2">
                Billing features are locked until this property's configuration
                is set. Please complete the configuration to continue.
              </p>

              <div className="flex justify-end mt-5 gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold"
                  onClick={() => setConfigModal(false)}
                >
                  Close
                </button>

                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
                  onClick={() =>
                    router.push(
                      `/pages/landlord/properties/${property_id}/configurations?id=${property_id}`
                    )
                  }
                >
                  Go to Configuration
                </button>
              </div>
            </div>
          </div>
        )}

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

            {/* Help Button */}
            <button
              onClick={startTour}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Show Guide</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4"
            id="action-buttons-section"
          >
            {propertyDetails?.water_billing_type === "submetered" ||
            propertyDetails?.electricity_billing_type === "submetered" ? (
              <>
                <button
                  disabled={configMissing}
                  onClick={() => !configMissing && setIsModalOpen(true)}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm ${
                    configMissing
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Set Rates
                </button>

                <button
                  disabled={configMissing}
                  onClick={() =>
                    configMissing
                      ? Swal.fire(
                          "Configuration Required",
                          "Please complete property configuration first.",
                          "warning"
                        )
                      : handleDownloadSummary()
                  }
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm ${
                    configMissing
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Summary
                </button>
              </>
            ) : (
              <button
                disabled={configMissing}
                onClick={() =>
                  configMissing
                    ? Swal.fire(
                        "Configuration Required",
                        "Please complete property configuration first.",
                        "warning"
                      )
                    : handleDownloadSummary()
                }
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm ${
                  configMissing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
                }`}
              >
                <Download className="w-4 h-4" />
                Summary
              </button>
            )}
          </div>

          {/* WARNING BANNER */}
          {configMissing && (
            <div className="mb-4">
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
                ⚠️ Billing features are disabled until the property
                configuration is completed.
                <button
                  onClick={() =>
                    router.push(
                      `/pages/landlord/properties/${property_id}/configurations?id=${property_id}`
                    )
                  }
                  className="ml-3 underline font-semibold text-red-700"
                >
                  Go to Configuration
                </button>
              </div>
            </div>
          )}

          {/* COUNTER SCORE CARD */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 mt-4"
            id="billing-stats-section"
          >
            {/* Total Units */}
            <div className="p-4 bg-white rounded-xl shadow border border-gray-200">
              <p className="text-xs text-gray-500">Total Units</p>
              <p className="text-xl font-bold text-gray-900">
                {bills?.length || 0}
              </p>
            </div>

            {/* With Bills */}
            <div className="p-4 bg-white rounded-xl shadow border border-gray-200">
              <p className="text-xs text-gray-500">Units With Bills</p>
              <p className="text-xl font-bold text-blue-700">
                {
                  bills.filter((b: any) => b.billing_status !== "no_bill")
                    .length
                }
              </p>
            </div>

            {/* Without Bills */}
            <div className="p-4 bg-white rounded-xl shadow border border-gray-200">
              <p className="text-xs text-gray-500">Units Without Bills</p>
              <p className="text-xl font-bold text-red-600">
                {
                  bills.filter((b: any) => b.billing_status === "no_bill")
                    .length
                }
              </p>
            </div>

            {/* Paid */}
            <div className="p-4 bg-white rounded-xl shadow border border-gray-200">
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-xl font-bold text-emerald-600">
                {
                  bills.filter(
                    (b: any) => b.billing_status?.toLowerCase() === "paid"
                  ).length
                }
              </p>
            </div>

            {/* Total Amount Due */}
            <div className="p-4 bg-white rounded-xl shadow border border-gray-200">
              <p className="text-xs text-gray-500">Total Amount Due</p>
              <p className="text-lg font-bold text-gray-900">
                ₱
                {bills
                  .reduce(
                    (sum: number, b: any) =>
                      sum + Number(b.total_amount_due || 0),
                    0
                  )
                  .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Billing Completion */}
            <div className="p-4 bg-white rounded-xl shadow border border-gray-200">
              <p className="text-xs text-gray-500">Billing Completion</p>
              <p className="text-xl font-bold text-purple-600">
                {bills.length === 0
                  ? "0%"
                  : Math.round(
                      (bills.filter((b: any) => b.billing_status !== "no_bill")
                        .length /
                        bills.length) *
                        100
                    ) + "%"}
              </p>
            </div>
          </div>

          {/* Rate Status Indicator */}
          {propertyDetails &&
            (propertyDetails.water_billing_type === "submetered" ||
              propertyDetails.electricity_billing_type === "submetered") && (
              <div
                id="rate-status-indicator"
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
                        hasBillingForMonth
                          ? "text-emerald-900"
                          : "text-amber-900"
                      }`}
                    >
                      {hasBillingForMonth
                        ? "Submeter Utility Rates Set"
                        : "Rates Not Set"}
                    </p>

                    <p
                      className={`text-xs mt-1 ${
                        hasBillingForMonth
                          ? "text-emerald-700"
                          : "text-amber-700"
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
          {propertyDetails &&
            propertyDetails.water_billing_type !== "submetered" &&
            propertyDetails.electricity_billing_type !== "submetered" && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Auto-Billing Enabled
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Monthly invoices are automatically generated for
                      non-submetered units BY default.
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
          onBillingUpdated={(updatedData: any) => {
            setBillingData(updatedData);
            setHasBillingForMonth(true);
          }}
        />

        <UnitMeterReadingsModal
          isOpen={openMeterList}
          onClose={() => setOpenMeterList(false)}
          property_id={property_id}
        />

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3 mb-6" id="units-list-section">
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
                        guardActionWithConfig(() =>
                          router.push(
                            `/pages/landlord/properties/${property_id}/billing/createUnitBill/${bill.unit_id}`
                          )
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
                          guardActionWithConfig(
                            () =>
                              (window.location.href = `/pages/landlord/properties/${property_id}/billing/non-submetered/review/${bill.unit_id}`)
                          )
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
        <div
          className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          id="units-list-section"
        >
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
                                guardActionWithConfig(() =>
                                  router.push(
                                    `/pages/landlord/properties/${property_id}/billing/createUnitBill/${bill.unit_id}`
                                  )
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
                                  guardActionWithConfig(
                                    () =>
                                      (window.location.href = `/pages/landlord/properties/${property_id}/billing/non-submetered/review/${bill.unit_id}`)
                                  )
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
