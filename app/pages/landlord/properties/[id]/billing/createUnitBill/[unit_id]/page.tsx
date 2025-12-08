"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import { BackButton } from "@/components/navigation/backButton";
import PropertyRatesModal from "@/components/landlord/properties/utilityRatesSetter";
import { HelpCircle } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { createUnitBillSteps } from "@/lib/onboarding/createUnitBill";

// modular components
import UnitHeader from "@/components/landlord/unitBilling/UnitHeader";
import UtilityRatesCard from "@/components/landlord/unitBilling/UtilityRatesCard";
import DatesForm from "@/components/landlord/unitBilling/DatesForm";
import MeterReadingForm from "@/components/landlord/unitBilling/MeterReadingForm";
import ExtraChargesForm from "@/components/landlord/unitBilling/ExtraChargesForm";
import DiscountsForm from "@/components/landlord/unitBilling/DiscountsForm";
import PDCCard from "@/components/landlord/unitBilling/PDCCard";
import BillingSummary from "@/components/landlord/unitBilling/BillingSummary";
import ActionsBar from "@/components/landlord/unitBilling/ActionsBar";

export default function CreateSubmeteredUnitBill() {
  const { unit_id } = useParams();
  const router = useRouter();
  const [unit, setUnit] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [propertyRates, setPropertyRates] = useState({
    waterRate: 0,
    electricityRate: 0,
  });
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  const [extraExpenses, setExtraExpenses] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [hasExistingBilling, setHasExistingBilling] = useState(false);
  const [existingBillingMeta, setExistingBillingMeta] = useState<any>(null);

  const [pdc, setPdc] = useState<any>(null);
  const [loadingPdc, setLoadingPdc] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    billingDate: today,
    readingDate: today,
    dueDate: "",
    waterPrevReading: "",
    waterCurrentReading: "",
    electricityPrevReading: "",
    electricityCurrentReading: "",
    discountAmount: "",
    otherCharges: "",
  });

  // Initialize onboarding
  const { startTour } = useOnboarding({
    tourId: "create-unit-bill",
    steps: createUnitBillSteps,
    autoStart: true,
  });

  useEffect(() => {
    if (!unit_id) return;
    fetchUnitData();
  }, [unit_id]);

  async function fetchPDCData(billingId?: number, leaseId?: number) {
    try {
      setLoadingPdc(true);
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
      let _pdc = null;
      if (Array.isArray(data?.pdcs)) {
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
      setPdc(null);
    } finally {
      setLoadingPdc(false);
    }
  }

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
      const dueDate = data.dueDate
        ? new Date(data.dueDate).toISOString().split("T")[0]
        : "";

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

      const eb = data.existingBilling;
      setForm((prev) => ({
        ...prev,
        readingDate: eb?.reading_date
          ? new Date(eb.reading_date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        dueDate: eb?.due_date
          ? new Date(eb.due_date).toISOString().split("T")[0]
          : dueDate,
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
        lease_id: eb?.lease_id,
        reading_date: eb?.reading_date ?? null,
        due_date: eb?.due_date ?? null,
      };
      setExistingBillingMeta(meta);
      setHasExistingBilling(!!eb?.billing_id);
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

  const handleAddExpense = () =>
    setExtraExpenses([...extraExpenses, { type: "", amount: 0 }]);
  const handleExpenseChange = (idx: number, field: string, value: any) => {
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

  const handleAddDiscount = () =>
    setDiscounts([...discounts, { type: "", amount: 0 }]);
  const handleDiscountChange = (idx: number, field: string, value: any) => {
    const updated = [...discounts];
    if (field === "amount") updated[idx].amount = parseFloat(value) || 0;
    else updated[idx].type = value;
    setDiscounts(updated);
  };

  const handleRemoveDiscount = async (index: number, item: any) => {
    try {
      if (item.fromDB && item.charge_id) {
        const confirm = await Swal.fire({
          title: "Delete this discount?",
          text: "This will permanently remove it from the billing record.",
          icon: "warning",
          showCancelButton: true,
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
    const totalBeforePdc =
      rent + dues + waterCost + elecCost + totalExtraCharges - totalDiscounts;
    const pdcAmount = Number(pdc?.amount || 0);
    const pdcCleared = pdc?.status === "cleared";
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
      pdcCoveredAmount,
    };
  };

  const bill = useMemo(() => {
    if (!unit || !property)
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
    return calculateBill();
  }, [unit, property, form, pdc, extraExpenses, discounts]);

  const handleMarkCleared = async () => {
    if (!pdc?.pdc_id) return;
    const confirm = await Swal.fire({
      title: "Mark PDC as Cleared?",
      text: "This will mark the check as cleared and apply it against this billing.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, mark cleared",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await axios.put(`/api/landlord/pdc/updateStatus`, {
        pdc_id: pdc.pdc_id,
        status: "cleared",
      });
      if (res.status === 200) {
        setPdc((prev: any) => (prev ? { ...prev, status: "cleared" } : prev));
        Swal.fire(
          "✅ Updated",
          "PDC has been marked as cleared successfully.",
          "success"
        );
      } else Swal.fire("Warning", "Unexpected server response.", "warning");
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
    // ---- Validation ----
    if (!form.billingDate || !form.readingDate || !form.dueDate) {
      Swal.fire(
        "Missing Fields",
        "Please enter Billing Date, Reading Date, and Due Date.",
        "warning"
      );
      return;
    }

    try {
      const computed = calculateBill();

      // Format additional charges + discounts
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

      // PDC computations
      const pdcAmountCleared =
        pdc && pdc.status === "cleared" ? Number(pdc.amount || 0) : 0;

      const rentCoveredByPdc = Math.min(
        pdcAmountCleared,
        Number(computed.rent || 0)
      );

      const finalTotalAmount = Math.max(
        0,
        Number(computed.rent || 0) -
          rentCoveredByPdc +
          Number(computed.dues || 0) +
          Number(computed.waterCost || 0) +
          Number(computed.elecCost || 0) +
          Number(computed.totalExtraCharges || 0) -
          Number(computed.totalDiscounts || 0)
      );

      // ---- FINAL PAYLOAD ----
      const payload = {
        unit_id: unit.unit_id,
        billingDate: form.billingDate,
        readingDate: form.readingDate,
        dueDate: form.dueDate,

        // Meter readings
        waterPrevReading: form.waterPrevReading,
        waterCurrentReading: form.waterCurrentReading,
        electricityPrevReading: form.electricityPrevReading,
        electricityCurrentReading: form.electricityCurrentReading,

        // Computed totals
        totalWaterAmount: computed.waterCost,
        totalElectricityAmount: computed.elecCost,
        total_amount_due: finalTotalAmount,

        additionalCharges: formattedCharges,
      };

      const url = "/api/landlord/billing/submetered/createUnitMonthlyBilling";
      const method = hasExistingBilling ? "put" : "post";

      const res = await axios({ method, url, data: payload });

      // Success path
      if (res.status === 200 || res.status === 201) {
        const successMsg = hasExistingBilling
          ? "Billing updated successfully!"
          : "Billing created successfully!";

        // Refresh billing_id if new
        if (!hasExistingBilling && res.data?.billing_id) {
          setExistingBillingMeta((prev: any) => ({
            ...(prev || {}),
            billing_id: res.data.billing_id,
          }));
          fetchPDCData(res.data.billing_id, existingBillingMeta?.lease_id);
        }

        // Ask for next unit
        const confirmNext = await Swal.fire({
          title: successMsg,
          text: "Do you want to proceed to the next unit?",
          icon: "success",
          showCancelButton: true,
          confirmButtonText: "Yes, next unit",
          cancelButtonText: "No, stay here",
        });

        // Move to next unit
        if (confirmNext.isConfirmed) {
          if (!property.units || property.units.length <= 1) {
            Swal.fire(
              "End of Units",
              "This property only has one unit. Billing setup is complete.",
              "info"
            );
            return;
          }

          const idx = property.units.findIndex(
            (u: any) => u.unit_id === unit.unit_id
          );
          const nextUnit = property.units[idx + 1];

          if (nextUnit) {
            // Reset form
            const today = new Date().toISOString().split("T")[0];
            setForm({
              billingDate: today,
              readingDate: today,
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
        }

        // Stay on same page
        else {
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="w-full px-4 md:px-6 pt-20 md:pt-6">
        <div className="flex items-center justify-between mb-4">
          {property && (
            <BackButton
              label="Back to Units"
              fallback={`/pages/landlord/properties/${property.property_id}/billing`}
            />
          )}

          <button
            onClick={startTour}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Show Guide</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mt-4">
          {property && unit && <UnitHeader property={property} unit={unit} />}

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8">
            {/* LEFT */}
            <div className="space-y-5">
              <div id="utility-rates-card">
                <UtilityRatesCard
                  property={property}
                  propertyRates={propertyRates}
                />
              </div>

              <div
                id="dates-form-section"
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <DatesForm
                  form={form}
                  setForm={setForm}
                  hasExistingBilling={hasExistingBilling}
                />
              </div>

              <div id="meter-readings-section">
                <MeterReadingForm
                  form={form}
                  setForm={setForm}
                  property={property}
                  existingBillingMeta={existingBillingMeta}
                />
              </div>

              <div id="extra-charges-section">
                <ExtraChargesForm
                  extraExpenses={extraExpenses}
                  handleAddExpense={handleAddExpense}
                  handleExpenseChange={handleExpenseChange}
                  handleRemoveExpense={handleRemoveExpense}
                />
              </div>

              <div id="discounts-section">
                <DiscountsForm
                  discounts={discounts}
                  handleAddDiscount={handleAddDiscount}
                  handleDiscountChange={handleDiscountChange}
                  handleRemoveDiscount={handleRemoveDiscount}
                />
              </div>

              {/* Mobile submit */}
              <div className="mt-8 block lg:hidden">
                <button
                  onClick={handleSubmit}
                  className={`w-full px-6 py-3 rounded-lg font-semibold shadow-sm ${
                    hasExistingBilling
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {hasExistingBilling ? "Update Billing" : "Submit Billing"}
                </button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-5 lg:sticky lg:top-4 lg:h-fit">
              <div id="billing-summary-section">
                <BillingSummary
                  bill={bill}
                  unit={unit}
                  property={property}
                  extraExpenses={extraExpenses}
                  discounts={discounts}
                  pdc={pdc}
                  loadingPdc={loadingPdc}
                />
              </div>

              <div id="pdc-card-section">
                <PDCCard
                  pdc={pdc}
                  loadingPdc={loadingPdc}
                  handleMarkCleared={handleMarkCleared}
                />
              </div>

              <ActionsBar
                onSubmit={handleSubmit}
                hasExistingBilling={hasExistingBilling}
              />
            </div>
          </div>
        </div>
      </div>

      <PropertyRatesModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        billingData={null}
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
