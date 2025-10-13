"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";
import Swal from "sweetalert2";
import { BackButton } from "@/components/navigation/backButton";

export default function CreateUnitBill() {
  const { unit_id } = useParams();
  const router = useRouter();
  const [unit, setUnit] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [propertyRates, setPropertyRates] = useState({
    waterRate: 0,
    electricityRate: 0,
  });

  const [extraExpenses, setExtraExpenses] = useState<
      { type: string; amount: number; fromDB?: boolean }[]
  >([]);

  const [discounts, setDiscounts] = useState<
      { type: string; amount: number; fromDB?: boolean }[]
  >([]);

  const [hasExistingBilling, setHasExistingBilling] = useState(false);


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
  }, [unit_id]);

  async function fetchUnitData() {
    try {
      const res = await axios.get(
          `/api/landlord/billing/getUnitBilling?unit_id=${unit_id}`
      );
      const data = res.data;

      console.log("datae", data);

      if (!data.unit || !data.property)
        throw new Error("Missing unit or property data.");

      setUnit(data.unit);
      setProperty(data.property);

      // 🧩 Helper to ensure date is formatted properly (YYYY-MM-DD)
      const formatDate = (d: any) => {
        if (!d) return "";
        try {
          return new Date(d).toISOString().split("T")[0];
        } catch {
          return "";
        }
      };

      // ✅ Compute due date (fallback to end of month)
      const today = new Date();
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];
      const dueDate = formatDate(data.dueDate || endOfMonth);

      // ✅ Fetch Rates
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

      // ✅ Prefill if existing billing
      const eb = data.existingBilling;
      if (eb) {
        setHasExistingBilling(true);

        setForm((prev) => ({
          ...prev,
          readingDate: formatDate(eb.reading_date) || prev.readingDate,
          dueDate: formatDate(eb.due_date) || dueDate,
          waterPrevReading: eb.water_prev ?? "",
          waterCurrentReading: eb.water_curr ?? "",
          electricityPrevReading: eb.elec_prev ?? "",
          electricityCurrentReading: eb.elec_curr ?? "",
        }));

        setExtraExpenses(
            eb.additional_charges?.map((c) => ({
              charge_id: c.id,
              type: c.charge_type,
              amount: c.amount,
              fromDB: true,
            })) || []
        );

        setDiscounts(
            eb.discounts?.map((d) => ({
              charge_id: d.id,
              type: d.charge_type,
              amount: d.amount,
              fromDB: true,
            })) || []
        );


      } else {
        setHasExistingBilling(false);
        setExtraExpenses([]);
        setDiscounts([]);
        setForm((prev) => ({
          ...prev,
          readingDate: formatDate(today),
          dueDate,
          waterPrevReading: "",
          waterCurrentReading: "",
          electricityPrevReading: "",
          electricityCurrentReading: "",
        }));
      }
    } catch (error) {
      console.error("Error fetching unit data:", error);
      Swal.fire("Error", "Failed to load property or unit details.", "error");
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const calculateBill = () => {
    const wPrev = parseFloat(form.waterPrevReading) || 0;
    const wCurr = parseFloat(form.waterCurrentReading) || 0;
    const ePrev = parseFloat(form.electricityPrevReading) || 0;
    const eCurr = parseFloat(form.electricityCurrentReading) || 0;

    const waterUsage = Math.max(0, wCurr - wPrev);
    const elecUsage = Math.max(0, eCurr - ePrev);

    const waterCost = waterUsage * (propertyRates.waterRate || 0);
    const elecCost = elecUsage * (propertyRates.electricityRate || 0);
    const rent = parseFloat(unit?.rent_amount || 0);
    const dues = parseFloat(property?.assoc_dues || 0);

    // Determine if due date has passed
    const today = new Date();
    const dueDate = new Date(form.dueDate);
    const isPastDue = today > dueDate;

    // Get property’s configured late fee (not applied yet)
    const lateFee = parseFloat(property?.late_fee || 0);

    // Sum of all manually added items
    const totalExtraCharges = extraExpenses.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0
    );
    const totalDiscounts = discounts.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0
    );

    // ✅ Exclude late fee from total until due date has passed
    const total =
        rent + dues + waterCost + elecCost + totalExtraCharges - totalDiscounts;

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
      total,
      isPastDue,
    };
  };

  const handleSubmit = async () => {
    if (!form.readingDate || !form.dueDate) {
      Swal.fire("Missing Fields", "Please select Reading Date and Due Date.", "warning");
      return;
    }

    try {
      const bill = calculateBill();

      const formattedCharges = [
        ...extraExpenses
            .filter((e) => e.type && parseFloat(e.amount) > 0)
            .map((e) => ({
              charge_category: "additional",
              charge_type: e.type.trim(),
              amount: parseFloat(e.amount),
            })),
        ...discounts
            .filter((d) => d.type && parseFloat(d.amount) > 0)
            .map((d) => ({
              charge_category: "discount",
              charge_type: d.type.trim(),
              amount: parseFloat(d.amount),
            })),
      ];

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
        total_amount_due: bill.total,
        additionalCharges: formattedCharges,
      };

      // ✅ Use PUT if existing billing, otherwise POST
      const url = hasExistingBilling
          ? "/api/landlord/billing/createUnitMonthlyBilling"
          : "/api/landlord/billing/createUnitMonthlyBilling";

      const method = hasExistingBilling ? "post" : "post";

      const res = await axios({ method, url, data: payload });

      if (res.status === 200 || res.status === 201) {
        const successMsg = hasExistingBilling
            ? "Billing updated successfully!"
            : "Billing saved successfully!";

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

        // 🧩 Handle Next Unit Navigation
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
              (u) => u.unit_id === unit.unit_id
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
            });

            await fetchUnitData(nextUnit.unit_id);

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
          Swal.fire("Saved!", "You can review this billing before continuing.", "info");
        }
      }
    } catch (error) {
      console.error("Error saving billing:", error);
      Swal.fire("Error", "Failed to save billing.", "error");
    }
  };

  // ===== Additional Charges Handlers =====
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
    console.log("Deleting charge:", item);

    try {
      // 🔹 If charge exists in DB, delete from backend
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

        Swal.fire("Deleted!", "Charge has been removed from billing.", "success");
      }

      // 🔹 Always update local state
      setExtraExpenses(extraExpenses.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error deleting charge:", error);
      Swal.fire("Error", "Failed to delete charge.", "error");
    }
  };

  const handleRemoveDiscount = async (index: number, item: any) => {
    console.log("Deleting discount:", item);

    try {
      // 🔹 If discount exists in DB, delete from backend
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

        Swal.fire("Deleted!", "Discount has been removed from billing.", "success");
      }

      // 🔹 Always update local state
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


  if (!unit || !property)
    return <div className="text-center mt-10 text-gray-500">Loading...</div>;

  const bill = calculateBill();

  return (
      <LandlordLayout>
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6">

          {property && (
              <BackButton
                  label="Back to Units"
                  fallback={`/pages/landlord/property-listing/view-unit/${property.property_id}`}
              />
          )}

          {/* ===== Header ===== */}
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {property.property_name} — Unit {unit.unit_name} Billing
          </h1>

          {/* ===== Two-column layout (1.2 : 0.8 on desktop) ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
            {/* ================= LEFT COLUMN: Billing Form ================= */}
            <div className="space-y-6">
              {/* ===== Property Rates ===== */}
              <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-800 mb-3">
                  Current Property Rates
                </h2>
                <div className="text-sm text-gray-700 space-y-2">
                  {property.water_billing_type === "submetered" && (
                      <div>
                        <p>💧 Water Rate: ₱{propertyRates.waterRate.toFixed(2)} per m³</p>
                        <p className="text-xs text-gray-500 italic">
                          Derived from latest property concessionaire billing.
                        </p>
                      </div>
                  )}
                  {property.electricity_billing_type === "submetered" && (
                      <div>
                        <p>⚡ Electricity Rate: ₱{propertyRates.electricityRate.toFixed(2)} per kWh</p>
                        <p className="text-xs text-gray-500 italic">
                          Based on current property electricity consumption.
                        </p>
                      </div>
                  )}
                </div>
              </div>
              {/* ===== Dates ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* === Reading Date === */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reading Date
                  </label>
                  <input
                      type="date"
                      name="readingDate"
                      value={form.readingDate || new Date().toISOString().split("T")[0]}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                  {hasExistingBilling ? (
                      <p className="text-xs text-yellow-700 italic mt-1">
                        ⚠️ This reading date was auto-filled from an existing billing. You may
                        adjust it if needed.
                      </p>
                  ) : (
                      <p className="text-xs text-gray-500 italic mt-1">
                        📅 Choose the date when the meter readings were taken.
                      </p>
                  )}
                </div>

                {/* === Due Date === */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                      type="date"
                      name="dueDate"
                      value={form.dueDate || ""}
                      readOnly
                      className="w-full border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {property?.hasBillingDueDate ? (
                        <>
                          📅 Automatically set based on your{" "}
                          <span className="font-medium text-gray-700">
            property configuration
          </span>.
                        </>
                    ) : (
                        <>
                          📅 Defaulted to the{" "}
                          <span className="font-medium text-gray-700">
            last day of this month
          </span>.
                        </>
                    )}
                  </p>
                </div>
              </div>

              {/* ===== Meter Readings ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.water_billing_type === "submetered" && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <h3 className="font-semibold text-blue-800 mb-2">💧 Water Meter</h3>
                      <div className="space-y-3">
                        <input
                            type="number"
                            name="waterPrevReading"
                            placeholder="Previous Reading"
                            value={form.waterPrevReading}
                            onChange={handleChange}
                            readOnly={!!form.fromDB}
                            className={`w-full border border-gray-300 rounded-md p-2 ${
                                form.fromDB ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                            }`}
                        />
                        <input
                            type="number"
                            name="waterCurrentReading"
                            placeholder="Current Reading"
                            value={form.waterCurrentReading}
                            onChange={handleChange}
                            readOnly={!!form.fromDB}
                            className={`w-full border border-gray-300 rounded-md p-2 ${
                                form.fromDB ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                            }`}
                        />
                      </div>
                    </div>
                )}

                {property.electricity_billing_type === "submetered" && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <h3 className="font-semibold text-yellow-800 mb-2">
                        ⚡ Electricity Meter
                      </h3>
                      <div className="space-y-3">
                        <input
                            type="number"
                            name="electricityPrevReading"
                            placeholder="Previous Reading"
                            value={form.electricityPrevReading}
                            onChange={handleChange}
                            readOnly={!!form.fromDB}
                            className={`w-full border border-gray-300 rounded-md p-2 ${
                                form.fromDB ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                            }`}
                        />
                        <input
                            type="number"
                            name="electricityCurrentReading"
                            placeholder="Current Reading"
                            value={form.electricityCurrentReading}
                            onChange={handleChange}
                            readOnly={!!form.fromDB}
                            className={`w-full border border-gray-300 rounded-md p-2 ${
                                form.fromDB ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
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
                  Add extra charges such as parking fees, association dues, or maintenance.
                  These will be added to the tenant’s monthly bill.
                </p>

                {extraExpenses.length > 0 ? (
                    extraExpenses.map((exp, idx) => (
                        <div
                            key={exp.charge_id || idx}
                            className="flex items-center gap-2 mb-2 bg-white border border-gray-200 rounded-lg p-2"
                        >
                          <input
                              type="text"
                              placeholder="Type (e.g. Parking)"
                              value={exp.type}
                              onChange={(e) => handleExpenseChange(idx, "type", e.target.value)}
                              className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white"
                          />
                          <input
                              type="number"
                              placeholder="Amount"
                              inputMode="decimal"
                              value={exp.amount}
                              onChange={(e) => handleExpenseChange(idx, "amount", e.target.value)}
                              className="w-32 px-3 py-2 border rounded-lg text-sm text-right bg-white"
                          />

                          {/* Delete button now passes full object (with charge_id) */}
                          <button
                              type="button"
                              onClick={() => handleRemoveExpense(idx, exp)}
                              className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
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
                    className="mt-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 text-sm font-medium"
                >
                  + Add Expense
                </button>
              </div>

              {/* ===== Discounts ===== */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Discounts:</h4>
                <p className="text-xs text-gray-500 mb-3">
                  Apply discounts such as promos, loyalty rewards, or landlord goodwill.
                  These will reduce the tenant’s monthly bill.
                </p>

                {discounts.length > 0 ? (
                    discounts.map((disc, idx) => (
                        <div
                            key={disc.charge_id || idx}
                            className="flex items-center gap-2 mb-2 bg-white border border-gray-200 rounded-lg p-2"
                        >
                          <input
                              type="text"
                              placeholder="Type (e.g. Promo)"
                              value={disc.type}
                              onChange={(e) => handleDiscountChange(idx, "type", e.target.value)}
                              className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white"
                          />
                          <input
                              type="number"
                              inputMode="decimal"
                              placeholder="Amount"
                              value={disc.amount}
                              onChange={(e) => handleDiscountChange(idx, "amount", e.target.value)}
                              className="w-32 px-3 py-2 border rounded-lg text-sm text-right bg-white"
                          />

                          <button
                              type="button"
                              onClick={() => handleRemoveDiscount(idx, disc)} // ✅ includes charge_id
                              className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-sm italic mb-2">No discounts applied.</p>
                )}

                <button
                    type="button"
                    onClick={handleAddDiscount}
                    className="mt-2 px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-green-700 text-sm font-medium"
                >
                  + Add Discount
                </button>
              </div>


              {/* ===== Submit Button (Mobile) ===== */}
              <div className="mt-8 block lg:hidden">
                <button
                    onClick={handleSubmit}
                    className={`w-full px-6 py-3 rounded-lg font-semibold shadow transition
  ${hasExistingBilling
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"}`}
                >
                  {hasExistingBilling ? "Update Billing" : "Submit Billing"}
                </button>

              </div>

            </div>

            {/* ================= RIGHT COLUMN: Billing Summary ================= */}
            <div className="space-y-6 sticky top-4 h-fit">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-green-600">💰</span> Billing Summary
                </h3>

                <div className="space-y-4 text-sm">
                  {/* === Utilities === */}
                  {(property.water_billing_type === "submetered" ||
                      property.electricity_billing_type === "submetered") && (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-cyan-100 rounded-xl p-4 shadow-sm">
                        <h4 className="text-sm font-semibold text-cyan-800 mb-3">
                          Utility Consumption
                        </h4>
                        <div className="divide-y divide-cyan-100">
                          {property.water_billing_type === "submetered" && (
                              <div className="flex justify-between py-2">
                                <span>💧 Water ({bill.waterUsage} m³)</span>
                                <span>₱{bill.waterCost.toFixed(2)}</span>
                              </div>
                          )}
                          {property.electricity_billing_type === "submetered" && (
                              <div className="flex justify-between py-2">
                                <span>⚡ Electricity ({bill.elecUsage} kWh)</span>
                                <span>₱{bill.elecCost.toFixed(2)}</span>
                              </div>
                          )}
                        </div>
                      </div>
                  )}

                  {/* === Fixed Charges === */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">
                      Fixed Charges
                    </h4>
                    <div className="divide-y divide-gray-200">
                      <div className="flex justify-between py-2">
                        <span>🏠 Rent</span>
                        <span>₱{bill.rent.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>🏢 Assoc. Dues</span>
                        <span>₱{bill.dues.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">⏰ Late Fee</span>
                          <span className="text-xs text-gray-500 italic">(for reference only)</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                      ₱{bill.lateFee.toFixed(2)}
                    </span>
                      </div>
                    </div>
                  </div>

                  {/* === Adjustments === */}
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-amber-800 mb-3">Adjustments</h4>
                    <div className="divide-y divide-amber-100">
                      <div className="flex justify-between py-2">
                        <span>📦 Additional Charges</span>
                        <span>₱{bill.totalExtraCharges.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span>🎁 Discounts</span>
                        <span className="text-green-600">
                      -₱{bill.totalDiscounts.toFixed(2)}
                    </span>
                      </div>
                    </div>
                  </div>

                  {/* === Total Due === */}
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl p-5 mt-4 shadow-md">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Total Amount Due</span>
                      <span className="text-2xl font-bold">₱{bill.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ===== Submit Button (Desktop) ===== */}
              <div className="hidden lg:flex justify-end">
                <button
                    onClick={handleSubmit}
                    className={`px-6 py-3 rounded-lg transition font-semibold shadow 
  ${hasExistingBilling
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"}`}
                >
                  {hasExistingBilling ? "Update Billing" : "Submit Billing"}
                </button>

              </div>

            </div>
          </div>
        </div>
      </LandlordLayout>
  );

}
