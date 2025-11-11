"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import { BackButton } from "@/components/navigation/backButton";
import PropertyRatesModal from "@/components/landlord/properties/utilityRatesSetter";
import { useMemo } from "react";
import {
  Droplets,
  Zap,
  DollarSign,
  Plus,
  X,
  Calendar,
  CreditCard,
  AlertCircle,
  Check,
} from "lucide-react";

/**
 * @page         CreateUnitBill
 * @route        app/pages/landlord/properties/[id]/billing/createUnitBill/[unit_id]
 * @desc         generate and edit unit billing for submetered properties.
 * @usedBy       Landlord → Property → Billing Module
 */

export default function CreateUnitBill() {
  const { unit_id } = useParams();
  const router = useRouter();

  const [unit, setUnit] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [propertyRates, setPropertyRates] = useState({
    waterRate: 0,
    electricityRate: 0,
  });
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  const [extraExpenses, setExtraExpenses] = useState<
    { type: string; amount: number; fromDB?: boolean; charge_id?: number }[]
  >([]);

  const [discounts, setDiscounts] = useState<
    { type: string; amount: number; fromDB?: boolean; charge_id?: number }[]
  >([]);

  const [hasExistingBilling, setHasExistingBilling] = useState(false);

  // 🔹 Keep some meta from backend existing billing for PDC lookup
  const [existingBillingMeta, setExistingBillingMeta] = useState<{
    billing_id?: number;
    lease_id?: number;
    reading_date?: string | null;
    due_date?: string | null;
  } | null>(null);

  // 🔹 PDC State
  const [pdc, setPdc] = useState<any>(null);
  const [loadingPdc, setLoadingPdc] = useState(false);

  const [form, setForm] = useState({
    readingDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    waterPrevReading: "",
    waterCurrentReading: "",
    electricityPrevReading: "",
    electricityCurrentReading: "",
    discountAmount: "",
    otherCharges: "",
  });

  useEffect(() => {
    if (!unit_id) return;
    fetchUnitData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit_id]);

  // ===== Helpers =====
  const fmtPHP = (n: number | string) =>
    Number(n || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDateStr = (d: any) => {
    if (!d) return "";
    try {
      return new Date(d).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  // ===== Fetch PDC by billing or lease =====
  async function fetchPDCData(billingId?: number, leaseId?: number) {
    try {
      setLoadingPdc(true);

      // prefer by billing first, then lease
      let res;
      if (billingId) {
        res = await axios.get(
          `/api/landlord/pdc/getByBilling?billing_id=${billingId}`
        );
      } else if (leaseId) {
        res = await axios.get(
          `/api/landlord/pdc/getByLease?lease_id=${leaseId}`
        );
      }

      const data = res?.data;
      // Expecting a single pdc or null. If array, pick the most relevant (e.g. pending/nearest due)
      let _pdc = null;

      if (Array.isArray(data?.pdcs)) {
        // pick pending first, else the latest cleared, else first
        _pdc =
          data.pdcs.find((x: any) => x.status === "pending") ||
          data.pdcs.find((x: any) => x.status === "cleared") ||
          data.pdcs[0] ||
          null;
      } else {
        _pdc = data?.pdc ?? null;
      }

      setPdc(_pdc);
    } catch (e) {
      // silent fail—no pdc is fine
      setPdc(null);
    } finally {
      setLoadingPdc(false);
    }
  }

  //  getting unit information data.
  async function fetchUnitData() {
    try {
      const res = await axios.get(
        `/api/landlord/billing/submetered/getUnitBilling?unit_id=${unit_id}`
      );
      const data = res.data;

      if (!data.unit || !data.property)
        throw new Error("Missing unit or property data.");

      setUnit(data.unit);
      setProperty(data.property);

      // ✅ Always trust backend for due date (from PropertyConfiguration)
      const dueDate = formatDateStr(data.dueDate);

      // ✅ Fetch property billing stats to compute per-cu/kWh rate
      const rateRes = await axios.get(
        `/api/landlord/billing/checkPropertyBillingStats?property_id=${data.property.property_id}`
      );
      const billing = rateRes.data.billingData;

      setPropertyRates({
        waterRate:
          billing?.water?.total && billing?.water?.consumption
            ? billing.water.total / billing.water.consumption
            : 0,
        electricityRate:
          billing?.electricity?.total && billing?.electricity?.consumption
            ? billing.electricity.total / billing.electricity.consumption
            : 0,
      });

      // ✅ Extract billing info (always returned even if new)
      const eb = data.existingBilling;

      // 🧩 Always prefill the form using backend's readings (safe fallback)
      setForm((prev) => ({
        ...prev,
        readingDate:
          formatDateStr(eb?.reading_date) || formatDateStr(new Date()),
        dueDate: formatDateStr(eb?.due_date) || dueDate,
        waterPrevReading: eb?.water_prev ?? "",
        waterCurrentReading: eb?.water_curr ?? "",
        electricityPrevReading: eb?.elec_prev ?? "",
        electricityCurrentReading: eb?.elec_curr ?? "",
      }));

      setExtraExpenses(
        eb?.additional_charges?.map((c: any) => ({
          charge_id: c.id,
          type: c.charge_type,
          amount: c.amount,
          fromDB: !!eb.billing_id,
        })) || []
      );

      setDiscounts(
        eb?.discounts?.map((d: any) => ({
          charge_id: d.id,
          type: d.charge_type,
          amount: d.amount,
          fromDB: !!eb.billing_id,
        })) || []
      );

      const meta = {
        billing_id: eb?.billing_id,
        lease_id: eb?.lease_id, // if your backend includes it
        reading_date: eb?.reading_date ?? null,
        due_date: eb?.due_date ?? null,
      };
      setExistingBillingMeta(meta);

      setHasExistingBilling(!!eb?.billing_id);

      // 🔎 Load PDC if there's an existing billing or a lease id
      if (meta.billing_id || meta.lease_id) {
        fetchPDCData(meta.billing_id, meta.lease_id);
      } else {
        setPdc(null);
      }
    } catch (error) {
      console.error("Error fetching unit data:", error);
      Swal.fire("Error", "Failed to load property or unit details.", "error");
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ====== BILL CALCULATION (fixed rent fallback + pdc covered amount) ======
  const calculateBill = () => {
    const wPrev = parseFloat(form.waterPrevReading) || 0;
    const wCurr = parseFloat(form.waterCurrentReading) || 0;
    const ePrev = parseFloat(form.electricityPrevReading) || 0;
    const eCurr = parseFloat(form.electricityCurrentReading) || 0;

    const waterUsage = Math.max(0, wCurr - wPrev);
    const elecUsage = Math.max(0, eCurr - ePrev);

    const waterCost = +(waterUsage * (propertyRates.waterRate || 0)).toFixed(2);
    const elecCost = +(
      elecUsage * (propertyRates.electricityRate || 0)
    ).toFixed(2);

    const rent = Number(unit?.effective_rent_amount || unit?.rent_amount || 0);

    console.log("rent amount with ?? condition: ", rent);

    const dues = Number(property?.assoc_dues ?? 0);
    const lateFee = Number(property?.late_fee ?? 0);

    const totalExtraCharges = extraExpenses.reduce(
      (sum, item) => sum + (parseFloat(String(item.amount)) || 0),
      0
    );
    const totalDiscounts = discounts.reduce(
      (sum, item) => sum + (parseFloat(String(item.amount)) || 0),
      0
    );

    // Base total (everything included) — this ALWAYS includes rent
    const totalBeforePdc =
      rent + dues + waterCost + elecCost + totalExtraCharges - totalDiscounts;

    // 🧮 PDC logic — only deduct from rent if cleared
    const pdcAmount = Number(pdc?.amount || 0);
    const pdcCleared = pdc?.status === "cleared";

    // amount of rent covered by PDC (cap at rent)
    const pdcCoveredAmount = pdcCleared ? Math.min(pdcAmount, rent) : 0;

    const rentAfterPdc = Math.max(0, rent - pdcCoveredAmount);

    const adjustedTotal =
      rentAfterPdc +
      dues +
      waterCost +
      elecCost +
      totalExtraCharges -
      totalDiscounts;

    return {
      waterUsage,
      elecUsage,
      waterCost,
      elecCost,
      rent,
      dues,
      lateFee,
      totalExtraCharges,
      totalDiscounts,
      totalBeforePdc,
      adjustedTotal,
      pdcAmount,
      pdcCleared,
      pdcCoveredAmount, // <-- helpful for UI messaging
    };
  };

  // ====== PDC: Mark as Cleared ======
  const handleMarkCleared = async () => {
    if (!pdc?.pdc_id) return;

    const confirm = await Swal.fire({
      title: "Mark PDC as Cleared?",
      text: "This will mark the check as cleared and apply it against this billing.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, mark cleared",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
    });

    if (!confirm.isConfirmed) return;

    try {
      // ✅ Always include both pdc_id and status
      const res = await axios.put(`/api/landlord/pdc/updateStatus`, {
        pdc_id: pdc.pdc_id,
        status: "cleared",
      });

      if (res.status === 200) {
        // ✅ Update local state immediately for UI feedback
        setPdc((prev: any) => (prev ? { ...prev, status: "cleared" } : prev));

        Swal.fire(
          "✅ Updated",
          "PDC has been marked as cleared successfully.",
          "success"
        );
      } else {
        Swal.fire("Warning", "Unexpected server response.", "warning");
      }
    } catch (error: any) {
      console.error("❌ Error marking PDC cleared:", error);
      Swal.fire(
        "Error",
        error.response?.data?.error || "Failed to update PDC status.",
        "error"
      );
    }
  };

  const handleSubmit = async () => {
    if (!form.readingDate || !form.dueDate) {
      Swal.fire(
        "Missing Fields",
        "Please select Reading Date and Due Date.",
        "warning"
      );
      return;
    }

    try {
      const bill = calculateBill();

      // ✅ Combine additional and discount charges
      const formattedCharges = [
        ...extraExpenses
          .filter((e) => e.type && parseFloat(String(e.amount)) > 0)
          .map((e) => ({
            charge_category: "additional",
            charge_type: e.type.trim(),
            amount: parseFloat(String(e.amount)),
          })),
        ...discounts
          .filter((d) => d.type && parseFloat(String(d.amount)) > 0)
          .map((d) => ({
            charge_category: "discount",
            charge_type: d.type.trim(),
            amount: parseFloat(String(d.amount)),
          })),
      ];

      // 🧮 Compute final total where PDC applies ONLY to rent (if cleared)
      // This logic is correct and respects the 'cleared' status.
      const pdcAmountCleared =
        pdc && pdc.status === "cleared" ? Number(pdc.amount || 0) : 0;

      // Rent covered by PDC cannot exceed rent
      const rentCoveredByPdc = Math.min(
        pdcAmountCleared,
        Number(bill.rent || 0)
      );

      // Rebuild total explicitly by components to ensure correct math:
      const finalTotalAmount = Math.max(
        0,
        Number(bill.rent || 0) -
          rentCoveredByPdc + // rent after PDC
          Number(bill.dues || 0) +
          Number(bill.waterCost || 0) +
          Number(bill.elecCost || 0) +
          Number(bill.totalExtraCharges || 0) -
          Number(bill.totalDiscounts || 0)
      );

      const payload = {
        unit_id: unit.unit_id,
        readingDate: form.readingDate,
        dueDate: form.dueDate,
        waterPrevReading: form.waterPrevReading,
        waterCurrentReading: form.waterCurrentReading,
        electricityPrevReading: form.electricityPrevReading,
        electricityCurrentReading: form.electricityCurrentReading,
        totalWaterAmount: bill.waterCost,
        totalElectricityAmount: bill.elecCost,
        total_amount_due: finalTotalAmount,
        additionalCharges: formattedCharges,

        // (optional) helpful metadata for backend/audit:
        // pdc_applied_to_rent: rentCoveredByPdc,
        // pdc_id: pdc?.pdc_id || null,
      };

      // ✅ Use PUT for existing billing, POST for new
      const url = "/api/landlord/billing/submetered/createUnitMonthlyBilling";
      const method = hasExistingBilling ? "put" : "post";

      const res = await axios({ method, url, data: payload });

      if (res.status === 200 || res.status === 201) {
        const successMsg = hasExistingBilling
          ? "Billing updated successfully!"
          : "Billing created successfully!";

        if (!hasExistingBilling && res.data?.billing_id) {
          setExistingBillingMeta((prev) => ({
            ...(prev || {}),
            billing_id: res.data.billing_id,
          }));
          fetchPDCData(res.data.billing_id, existingBillingMeta?.lease_id);
        }

        const confirmNext = await Swal.fire({
          title: successMsg,
          text: "Do you want to proceed to the next unit?",
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "Yes, next unit",
          cancelButtonText: "No, stay here",
          confirmButtonColor: "#16a34a",
          cancelButtonColor: "#6b7280",
        });

        if (confirmNext.isConfirmed) {
          if (!property.units || property.units.length <= 1) {
            Swal.fire(
              "End of Units",
              "This property only has one unit. Billing setup is complete.",
              "info"
            );
            return;
          }

          const currentIndex = property.units.findIndex(
            (u: any) => u.unit_id === unit.unit_id
          );
          const nextUnit = property.units[currentIndex + 1];

          if (nextUnit) {
            setForm({
              readingDate: "",
              dueDate: "",
              waterPrevReading: "",
              waterCurrentReading: "",
              electricityPrevReading: "",
              electricityCurrentReading: "",
              discountAmount: "",
              otherCharges: "",
            });

            router.push(
              `/pages/landlord/properties/${property.property_id}/billing/createUnitBill/${nextUnit.unit_id}`
            );

            Swal.fire(
              "Next Unit Loaded",
              `You are now billing ${nextUnit.unit_name}`,
              "info"
            );
          } else {
            Swal.fire(
              "All Done!",
              "There are no more units to bill for this property.",
              "success"
            );
          }
        } else {
          // Re-fetch data to show the updated (now "existing") bill
          fetchUnitData();
          Swal.fire(
            "Saved!",
            "You can review this billing before continuing.",
            "info"
          );
        }
      }
    } catch (error) {
      console.error("Error saving billing:", error);
      Swal.fire("Error", "Failed to save billing.", "error");
    }
  };

  const handleAddExpense = () => {
    setExtraExpenses([...extraExpenses, { type: "", amount: 0 }]);
  };

  const handleExpenseChange = (idx: number, field: string, value: string) => {
    const updated = [...extraExpenses];
    if (field === "amount") updated[idx].amount = parseFloat(value) || 0;
    else updated[idx].type = value;
    setExtraExpenses(updated);
  };

  const handleRemoveExpense = async (index: number, item: any) => {
    try {
      if (item.fromDB && item.charge_id) {
        const confirm = await Swal.fire({
          title: "Delete this additional charge?",
          text: "This will permanently remove it from the billing record.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Yes, delete it",
        });

        if (!confirm.isConfirmed) return;

        await axios.delete("/api/billing/non_submetered/deleteCharge", {
          data: { charge_id: item.charge_id },
        });

        Swal.fire(
          "Deleted!",
          "Charge has been removed from billing.",
          "success"
        );
      }

      setExtraExpenses(extraExpenses.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting charge:", error);
      Swal.fire("Error", "Failed to delete charge.", "error");
    }
  };

  const handleRemoveDiscount = async (index: number, item: any) => {
    try {
      if (item.fromDB && item.charge_id) {
        const confirm = await Swal.fire({
          title: "Delete this discount?",
          text: "This will permanently remove it from the billing record.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Yes, delete it",
        });

        if (!confirm.isConfirmed) return;

        await axios.delete("/api/billing/non_submetered/deleteCharge", {
          data: { charge_id: item.charge_id },
        });

        Swal.fire(
          "Deleted!",
          "Discount has been removed from billing.",
          "success"
        );
      }

      setDiscounts(discounts.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting discount:", error);
      Swal.fire("Error", "Failed to delete discount.", "error");
    }
  };

  // ===== Discounts Handlers =====
  const handleAddDiscount = () => {
    setDiscounts([...discounts, { type: "", amount: 0 }]);
  };

  const handleDiscountChange = (idx: number, field: string, value: string) => {
    const updated = [...discounts];
    if (field === "amount") updated[idx].amount = parseFloat(value) || 0;
    else updated[idx].type = value;
    setDiscounts(updated);
  };

  const bill = useMemo(() => {
    if (!unit || !property) {
      return {
        rent: 0,
        dues: 0,
        waterUsage: 0,
        elecUsage: 0,
        waterCost: 0,
        elecCost: 0,
        totalExtraCharges: 0,
        totalDiscounts: 0,
        baseTotal: 0,
        adjustedTotal: 0,
        pdcAmount: 0,
        pdcCleared: false,
      };
    }

    return calculateBill();
  }, [unit, property, form, pdc, extraExpenses, discounts]);

  if (!unit || !property)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        {/* ===== Header / Back ===== */}
        {property && (
          <div className="mb-4">
            <BackButton
              label="Back to Units"
              // @ts-ignore (your BackButton may accept fallback)
              fallback={`/pages/landlord/properties/${property.property_id}/billing`}
            />
          </div>
        )}

        {/* ===== Card Root ===== */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          {/* ===== Title ===== */}
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {property.property_name} — Unit {unit.unit_name} Billing
            </h1>
          </div>

          {/* ===== Mobile-first stacked, 2-col on lg ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8">
            {/* ================= LEFT: Form ================= */}
            <div className="space-y-5">
              {/* ===== Property Rates ===== */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
                <div className="text-sm text-gray-700 space-y-2">
                  {property.water_billing_type === "submetered" && (
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-600" />
                        Water Rate: ₱{propertyRates.waterRate.toFixed(2)} per m³
                      </p>
                      <p className="text-xs text-gray-500 italic mt-1">
                        Computation is derived from the current water billing.
                      </p>
                    </div>
                  )}
                  {property.electricity_billing_type === "submetered" && (
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-600" />
                        Electricity Rate: ₱
                        {propertyRates.electricityRate.toFixed(2)} per kWh
                      </p>
                      <p className="text-xs text-gray-500 italic mt-1">
                        Computation is derived from the current electricity
                        billing.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ===== Dates ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* === Reading Date === */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Reading Date
                  </label>
                  <input
                    type="date"
                    name="readingDate"
                    value={
                      form.readingDate || new Date().toISOString().split("T")[0]
                    }
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {hasExistingBilling ? (
                    <p className="text-xs text-amber-700 italic mt-1.5 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      This reading date was auto-filled from an existing
                      billing. You may adjust it if needed.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 italic mt-1.5 flex items-start gap-1">
                      <Calendar className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      Choose the date when the meter readings were taken.
                    </p>
                  )}
                </div>

                {/* === Due Date === */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1">
                    <Calendar className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    This due date is based on your PropertyConfiguration
                    billingDueDay.
                  </p>
                </div>
              </div>

              {/* ===== Meter Readings ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.water_billing_type === "submetered" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <Droplets className="w-4 h-4" />
                      Water Meter
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="waterPrevReading"
                        placeholder="Previous Reading"
                        value={form.waterPrevReading}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.]/g, "");
                          if ((value.match(/\./g) || []).length > 1) return;
                          const parts = value.split(".");
                          if (parts[0].length > 6)
                            parts[0] = parts[0].slice(0, 6);
                          if (parts[1]?.length > 2)
                            parts[1] = parts[1].slice(0, 2);
                          value = parts.join(".");
                          setForm((prev) => ({
                            ...prev,
                            waterPrevReading: value,
                          }));
                        }}
                        inputMode="decimal"
                        readOnly={
                          !!(
                            existingBillingMeta &&
                            existingBillingMeta.billing_id
                          )
                        }
                        maxLength={9}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          existingBillingMeta?.billing_id
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : ""
                        }`}
                      />

                      <input
                        type="text"
                        name="waterCurrentReading"
                        placeholder="Current Reading"
                        value={form.waterCurrentReading}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.]/g, "");
                          if ((value.match(/\./g) || []).length > 1) return;
                          const parts = value.split(".");
                          if (parts[0].length > 6)
                            parts[0] = parts[0].slice(0, 6);
                          if (parts[1]?.length > 2)
                            parts[1] = parts[1].slice(0, 2);
                          value = parts.join(".");
                          setForm((prev) => ({
                            ...prev,
                            waterCurrentReading: value,
                          }));
                        }}
                        inputMode="decimal"
                        readOnly={
                          !!(
                            existingBillingMeta &&
                            existingBillingMeta.billing_id
                          )
                        }
                        maxLength={9}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          existingBillingMeta?.billing_id
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </div>
                  </div>
                )}

                {property.electricity_billing_type === "submetered" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Electricity Meter
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="electricityPrevReading"
                        placeholder="Previous Reading"
                        value={form.electricityPrevReading}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.]/g, "");
                          if ((value.match(/\./g) || []).length > 1) return;
                          const parts = value.split(".");
                          if (parts[0].length > 6)
                            parts[0] = parts[0].slice(0, 6);
                          if (parts[1]?.length > 2)
                            parts[1] = parts[1].slice(0, 2);
                          value = parts.join(".");
                          setForm((prev) => ({
                            ...prev,
                            electricityPrevReading: value,
                          }));
                        }}
                        inputMode="decimal"
                        readOnly={
                          !!(
                            existingBillingMeta &&
                            existingBillingMeta.billing_id
                          )
                        }
                        maxLength={9}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                          existingBillingMeta?.billing_id
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : ""
                        }`}
                      />

                      <input
                        type="text"
                        name="electricityCurrentReading"
                        placeholder="Current Reading"
                        value={form.electricityCurrentReading}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.]/g, "");
                          if ((value.match(/\./g) || []).length > 1) return;
                          const parts = value.split(".");
                          if (parts[0].length > 6)
                            parts[0] = parts[0].slice(0, 6);
                          if (parts[1]?.length > 2)
                            parts[1] = parts[1].slice(0, 2);
                          value = parts.join(".");
                          setForm((prev) => ({
                            ...prev,
                            electricityCurrentReading: value,
                          }));
                        }}
                        inputMode="decimal"
                        readOnly={
                          !!(
                            existingBillingMeta &&
                            existingBillingMeta.billing_id
                          )
                        }
                        maxLength={9}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors ${
                          existingBillingMeta?.billing_id
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ===== Additional Charges ===== */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Additional Charges:
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Add extra charges such as parking fees, association dues, or
                  maintenance. These will be added to the tenant's monthly bill.
                </p>

                {extraExpenses.length > 0 ? (
                  extraExpenses.map((exp, idx) => (
                    <div
                      key={exp.charge_id || idx}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 bg-white border border-gray-200 rounded-lg p-2"
                    >
                      <input
                        type="text"
                        placeholder="Type (e.g. Parking)"
                        value={exp.type}
                        onChange={(e) =>
                          handleExpenseChange(idx, "type", e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Amount"
                          inputMode="decimal"
                          value={exp.amount}
                          onChange={(e) =>
                            handleExpenseChange(idx, "amount", e.target.value)
                          }
                          className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExpense(idx, exp)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove additional charge"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic mb-2">
                    No additional charges set.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleAddExpense}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Expense
                </button>
              </div>

              {/* ===== Discounts ===== */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Discounts:
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Apply discounts such as promos, loyalty rewards, or landlord
                  goodwill. These will reduce the tenant's monthly bill.
                </p>

                {discounts.length > 0 ? (
                  discounts.map((disc, idx) => (
                    <div
                      key={disc.charge_id || idx}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 bg-white border border-gray-200 rounded-lg p-2"
                    >
                      <input
                        type="text"
                        placeholder="Type (e.g. Promo)"
                        value={disc.type}
                        onChange={(e) =>
                          handleDiscountChange(idx, "type", e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder="Amount"
                          value={disc.amount}
                          onChange={(e) =>
                            handleDiscountChange(idx, "amount", e.target.value)
                          }
                          className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDiscount(idx, disc)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove discount"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic mb-2">
                    No discounts applied.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleAddDiscount}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-700 text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Discount
                </button>
              </div>

              {/* ===== Submit Button (Mobile) ===== */}
              <div className="mt-8 block lg:hidden">
                <button
                  onClick={handleSubmit}
                  className={`w-full px-6 py-3 rounded-lg font-semibold shadow-sm transition-colors ${
                    hasExistingBilling
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {hasExistingBilling ? "Update Billing" : "Submit Billing"}
                </button>
              </div>
            </div>

            {/* ================= RIGHT: Summary + PDC ================= */}
            <div className="space-y-5 lg:sticky lg:top-4 lg:h-fit">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Billing Summary
                </h3>

                <div className="space-y-4 text-sm">
                  {/* === Utilities === */}
                  {(property.water_billing_type === "submetered" ||
                    property.electricity_billing_type === "submetered") && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-cyan-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-cyan-800 mb-3">
                        Utility Consumption
                      </h4>
                      <div className="divide-y divide-cyan-100">
                        {property.water_billing_type === "submetered" && (
                          <div className="flex justify-between py-2 text-sm">
                            <span className="flex items-center gap-2">
                              <Droplets className="w-4 h-4 text-blue-600" />
                              Water ({bill.waterUsage} m³)
                            </span>
                            <span className="font-semibold">
                              ₱{bill.waterCost.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {property.electricity_billing_type === "submetered" && (
                          <div className="flex justify-between py-2 text-sm">
                            <span className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-amber-600" />
                              Electricity ({bill.elecUsage} kWh)
                            </span>
                            <span className="font-semibold">
                              ₱{bill.elecCost.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* === Fixed Charges === */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">
                      Fixed Charges
                    </h4>
                    <div className="divide-y divide-gray-200">
                      {/* 🏠 Rent */}
                      <div className="flex justify-between py-2 text-sm">
                        <span>🏠 Rent</span>
                        <span className="font-semibold">
                          ₱
                          {fmtPHP(
                            Number(
                              unit?.effective_rent_amount ||
                                unit?.rent_amount ||
                                0
                            )
                          )}
                        </span>
                      </div>

                      {/* 🏢 Association Dues */}
                      <div className="flex justify-between py-2 text-sm">
                        <span>🏢 Assoc. Dues</span>
                        <span className="font-semibold">
                          ₱{fmtPHP(bill.dues || 0)}
                        </span>
                      </div>

                      {/* ⏰ Late Fee (reference only) */}
                      <div className="flex justify-between items-center py-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700">
                            ⏰ Late Fee
                          </span>
                          <span className="text-xs text-gray-500 italic">
                            (for reference only)
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          ₱{fmtPHP(bill.lateFee || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* === Adjustments === */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-amber-800 mb-3">
                      Adjustments
                    </h4>
                    <div className="divide-y divide-amber-100">
                      <div className="flex justify-between py-2 text-sm">
                        <span>📦 Additional Charges</span>
                        <span className="font-semibold">
                          ₱{bill.totalExtraCharges.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 text-sm">
                        <span>🎁 Discounts</span>
                        <span className="text-emerald-600 font-semibold">
                          -₱{bill.totalDiscounts.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* === PDC Card (if any) === */}
                  {loadingPdc ? (
                    <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50 text-indigo-700 text-sm">
                      Loading PDC details…
                    </div>
                  ) : pdc ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-indigo-800 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Post-Dated Check
                        </h4>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                            pdc.status === "cleared"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : pdc.status === "bounced"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {String(pdc.status || "").toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 mb-3">
                        <p>
                          <strong>Bank:</strong> {pdc.bank_name || "—"}
                        </p>
                        <p>
                          <strong>Check #:</strong> {pdc.check_number || "—"}
                        </p>
                        <p>
                          <strong>Amount:</strong> ₱{fmtPHP(pdc.amount || 0)}
                        </p>
                        <p>
                          <strong>Due Date:</strong>{" "}
                          {pdc.due_date
                            ? new Date(pdc.due_date).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>

                      {pdc.status !== "cleared" && pdc.status !== "bounced" && (
                        <button
                          onClick={handleMarkCleared}
                          className="w-full mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Mark as Cleared
                        </button>
                      )}

                      {pdc.status === "cleared" && (
                        <p className="mt-2 text-xs text-emerald-700 flex items-start gap-1">
                          <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          This cleared PDC is applied to the total due below.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-gray-600 text-sm">
                      No PDC linked to this billing (or lease).
                    </div>
                  )}

                  {/* === Total Due === */}
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg p-5 shadow-sm">
                    <div className="flex flex-col gap-2">
                      {/* Base total always full amount */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold opacity-90">
                          Total Billing Amount
                        </span>
                        <span className="text-base font-bold">
                          ₱{Number(bill?.totalBeforePdc ?? 0).toFixed(2)}
                        </span>
                      </div>

                      {/* PDC Info */}
                      {pdc?.status === "cleared" && (
                        <div className="flex flex-col mt-2 p-2 rounded-lg bg-white/10 border border-white/20">
                          <span className="text-sm font-medium text-white flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            Rent portion paid via cleared PDC
                          </span>
                          <span className="text-xs text-white/90 mt-1">
                            Remaining due covers utilities and additional
                            charges.
                          </span>
                        </div>
                      )}

                      <div className="h-px bg-white/30 my-1"></div>

                      {/* Final total (deduct rent only if cleared) */}
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold">
                          Total Amount Due
                        </span>
                        <span className="text-2xl font-extrabold">
                          ₱
                          {(pdc?.status === "cleared"
                            ? bill?.adjustedTotal ?? 0 // ✅ Rent reduced by cleared PDC
                            : bill?.totalBeforePdc ?? 0
                          ) // ✅ Full amount if no PDC or not cleared
                            .toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                        </span>
                      </div>

                      {/* Optional: PDC message for clarity */}
                      {pdc && (
                        <p className="mt-2 text-xs italic text-white/90">
                          {pdc.status === "cleared"
                            ? `✅ Cleared PDC applied — ₱${(
                                bill?.pdcCoveredAmount || 0
                              ).toLocaleString("en-PH", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} deducted from rent.`
                            : `⚠️ PDC not cleared — full rent amount still included.`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== Submit Button (Desktop) ===== */}
              <div className="hidden lg:flex justify-end">
                <button
                  onClick={handleSubmit}
                  className={`px-6 py-3 rounded-lg font-semibold shadow-sm transition-colors ${
                    hasExistingBilling
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {hasExistingBilling ? "Update Billing" : "Submit Billing"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Modal: Property Utility Rate ===== */}
      <PropertyRatesModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        billingData={null /* keep passthrough as before if needed */}
        billingForm={{
          billingPeriod: "",
          electricityConsumption: "",
          electricityTotal: "",
          waterConsumption: "",
          waterTotal: "",
        }}
        propertyDetails={property}
        hasBillingForMonth={false}
        handleInputChange={() => {}}
        handleSaveOrUpdateBilling={() => {}}
      />
    </div>
  );
}
