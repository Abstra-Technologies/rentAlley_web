"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";
import Swal from "sweetalert2";
import useAuth from "../../../../../../../hooks/useSession";

export default function CreateUnitBill() {
  const { unit_id } = useParams();
  const router = useRouter();
  const [unit, setUnit] = useState(null);
  const [property, setProperty] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    readingDate: "",
    waterPrevReading: "",
    waterCurrentReading: "",
    electricityPrevReading: "",
    electricityCurrentReading: "",
    totalWaterAmount: "",
    totalElectricityAmount: "",
    penaltyAmount: "",
    discountAmount: "",
    totalAmountDue: "",
    rentAmount: "",
    associationDues: "",
    lateFee: "",
    dueDate: "",
  });
  const [propertyRates, setPropertyRates] = useState({
    waterRate: 0,
    electricityRate: 0,
  });
  useEffect(() => {
    if (!unit_id) return;

    async function fetchUnitData() {
      try {
        const res = await axios.get(
          `/api/landlord/billing/getUnitBill?unit_id=${unit_id}`
        );
        const data = res.data;

        if (!data.unit || !data.property) {
          new Error("Missing unit or property data");
        }

        setUnit(data.unit);
        setProperty(data.property);

        const concessionaireRes = await axios.get(
          `/api/landlord/billing/saveConcessionaireBilling?property_id=${data?.property?.property_id}`
        );
        let concessionaireData = concessionaireRes.data;

        if (!Array.isArray(concessionaireData)) {
          concessionaireData = [];
        }
        let waterRate = 0;
        let electricityRate = 0;

        concessionaireData.forEach((bill) => {
          if (bill.utility_type === "water") {
            waterRate = bill.rate_consumed;
          } else if (bill.utility_type === "electricity") {
            electricityRate = bill.rate_consumed;
          }
        });
        setPropertyRates({ waterRate, electricityRate });

        setForm((prevForm) => ({
          ...prevForm,
          waterRate,
          electricityRate,
        }));
      } catch (error) {
        console.error("Error fetching unit data:", error);
      }
    }

    fetchUnitData();
  }, [unit_id]);

  const calculateUtilityBill = () => {
    const electricityPrevReading = parseFloat(form.electricityPrevReading) || 0;
    const electricityCurrentReading =
      parseFloat(form.electricityCurrentReading) || 0;
    const waterPrevReading = parseFloat(form.waterPrevReading) || 0;
    const waterCurrentReading = parseFloat(form.waterCurrentReading) || 0;

    //  property-wide rates
    const electricityRate = parseFloat(propertyRates.electricityRate) || 0;
    const waterRate = parseFloat(propertyRates.waterRate) || 0;

    // Calculate usage
    const electricityUsage = Math.max(
      0,
      electricityCurrentReading - electricityPrevReading
    );
    const waterUsage = Math.max(0, waterCurrentReading - waterPrevReading);

    // Calculate cost using rates
    const electricityCost = electricityUsage * electricityRate;
    const waterCost = waterUsage * waterRate;

    // Other costs
    const rentAmount = parseFloat(unit?.rent_amount) || 0;
    const associationDues = parseFloat(property?.assoc_dues) || 0;
    const lateFee = parseFloat(property?.late_fee) || 0;

    const penaltyAmount = parseFloat(form.penaltyAmount) || 0;
    const discountAmount = parseFloat(form.discountAmount) || 0;

    const subtotal = electricityCost + waterCost + rentAmount + associationDues;

    // Compute total with late fee, penalty, and discount
    const total = subtotal + lateFee + penaltyAmount - discountAmount;

    return {
      electricity: {
        usage: electricityUsage,
        rate: electricityRate.toFixed(2),
        cost: electricityCost.toFixed(2),
      },
      water: {
        usage: waterUsage,
        rate: waterRate.toFixed(2),
        cost: waterCost.toFixed(2),
      },
      rentAmount: rentAmount.toFixed(2),
      associationDues: associationDues.toFixed(2),
      lateFee: lateFee.toFixed(2),
      penaltyAmount: penaltyAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  if (!unit || !property) return <p>Loading...</p>;

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const billingData = {
        readingDate: form.readingDate,
        totalWaterAmount: parseFloat(calculateUtilityBill().water.cost) || 0,
        totalElectricityAmount:
          parseFloat(calculateUtilityBill().electricity.cost) || 0,
        penaltyAmount: parseFloat(form.penaltyAmount) || 0,
        discountAmount: parseFloat(form.discountAmount) || 0,
        dueDate: form.dueDate,
        unit_id: unit.unit_id,
        waterPrevReading: form.waterPrevReading,
        waterCurrentReading: form.waterCurrentReading,
        electricityPrevReading: form.electricityPrevReading,
        electricityCurrentReading: form.electricityCurrentReading,
        total_amount_due: parseFloat(calculateUtilityBill().total),
      };

      const res = await axios.post("/api/billing/create", billingData);

      if (res.status === 201) {
        Swal.fire({
          title: "Success!",
          text: "Billing saved successfully!",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          router.push(
            `/pages/landlord/billing/viewUnit/${property.property_id}`
          );
        });
        setForm({
          readingDate: "",
          waterPrevReading: "",
          waterCurrentReading: "",
          electricityPrevReading: "",
          electricityCurrentReading: "",
          totalWaterAmount: "",
          totalElectricityAmount: "",
          penaltyAmount: "",
          discountAmount: "",
          totalAmountDue: "",
          rentAmount: "",
          associationDues: "",
          lateFee: "",
          dueDate: "",
        });
      }
    } catch (error) {
      console.error("Error saving billing:", error);
      alert("Failed to save billing.");
    }
  };

  return (
    <LandlordLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold">Unit {unit?.unit_name} - Billing</h1>

        {/* Show Billing History */}
        <div className="mt-4 p-4 border rounded-lg bg-gray-100">
          <h2 className="text-lg font-semibold flex justify-between">
            Property Rate
            <span className="text-gray-500">
              {new Date().toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </h2>
          <p>Water Rate: ₱{propertyRates?.waterRate} per m³</p>
          <p>Electricity Rate: ₱{propertyRates?.electricityRate} per kWh</p>
        </div>

        {/* Step-by-step Billing Form */}
        <div className="mt-6 p-4 border rounded-lg bg-white">
          <h2 className="text-lg font-semibold">
            Create New Bill (Step {step}/3)
          </h2>

          {/* Step 1: Meter Readings */}
          {step === 1 && (
            <div>
              <p className="text-sm text-gray-600">
                {property.utility_billing_type === "submetered"
                  ? "Enter meter readings for water and electricity."
                  : property.utility_billing_type === "included"
                  ? "Utility costs are included in rent. Only total amounts are needed."
                  : "No meter readings needed for this billing type."}
              </p>

              {/* Reading Date Input */}
              <div className="mt-2">
                <label className="block text-gray-700 font-medium">
                  Reading Date
                </label>
                <input
                  type="date"
                  name="readingDate"
                  placeholder="Reading Date"
                  value={form.readingDate}
                  onChange={handleChange}
                  className="p-2 border rounded w-full"
                />
              </div>

              {property.utility_billing_type === "submetered" && (
                <>
                  <label className="block text-gray-700 font-medium">
                   Previous Water Meter Reading
                  </label>
                  <input
                    type="number"
                    name="waterPrevReading"
                    placeholder="Previous Water Reading"
                    value={form.waterPrevReading}
                    onChange={handleChange}
                    className="mt-2 p-2 border rounded w-full"
                  />
                  <label className="block text-gray-700 font-medium">
                    Current Water Meter Reading
                  </label>
                  <input
                    type="number"
                    name="waterCurrentReading"
                    placeholder="Current Water Reading"
                    value={form.waterCurrentReading}
                    onChange={handleChange}
                    className="mt-2 p-2 border rounded w-full"
                  />
                  <label className="block text-gray-700 font-medium">
                   Previous Electricity Meter Reading
                  </label>
                  <input
                    type="number"
                    name="electricityPrevReading"
                    placeholder="Previous Electricity Reading"
                    value={form.electricityPrevReading}
                    onChange={handleChange}
                    className="mt-2 p-2 border rounded w-full"
                  />
                  <label className="block text-gray-700 font-medium">
                    Current Electricity Meter Reading
                  </label>
                  <input
                    type="number"
                    name="electricityCurrentReading"
                    placeholder="Current Electricity Reading"
                    value={form.electricityCurrentReading}
                    onChange={handleChange}
                    className="mt-2 p-2 border rounded w-full"
                  />
                </>
              )}

              {property.utility_billing_type === "provider" && (
                <>
                  <input
                    type="number"
                    name="totalWaterAmount"
                    placeholder="Total Water Amount"
                    value={form.totalWaterAmount}
                    onChange={handleChange}
                    className="mt-2 p-2 border rounded w-full"
                  />
                  <input
                    type="number"
                    name="totalElectricityAmount"
                    placeholder="Total Electricity Amount"
                    value={form.totalElectricityAmount}
                    onChange={handleChange}
                    className="mt-2 p-2 border rounded w-full"
                  />
                </>
              )}
            </div>
          )}

          {/* Step 2: Rent, Late Fees, and Dues */}
          {step === 2 && (
            <>
              <div className="mt-2">
                <label className="block text-gray-700 font-medium">
                  Due Date
                </label>
                <input
                    type="date"
                    name="dueDate"
                    placeholder="Due Date"
                    value={form.dueDate}
                    onChange={handleChange}
                    className="p-2 border rounded w-full"
                />
              </div>
              <div className="mt-2">
                <label className="block text-gray-700 font-medium">
                  Rent Amount
                </label>
                <input
                  type="number"
                  name="rentAmount"
                  placeholder="Rent Amount"
                  value={unit?.rent_amount}
                  disabled
                  className="p-2 border rounded w-full bg-gray-100"
                />
              </div>

              <div className="mt-2">
                <label className="block text-gray-700 font-medium">
                  Association Dues
                </label>
                <input
                  type="number"
                  name="assoc_dues"
                  placeholder="Association Dues"
                  value={property.assoc_dues}
                  disabled
                  className="p-2 border rounded w-full bg-gray-100"
                />
              </div>

              <div className="mt-2">
                <label className="block text-gray-700 font-medium">
                  Late Fee
                </label>
                <input
                  type="number"
                  name="lateFee"
                  placeholder="Late Fee"
                  value={property.late_fee}
                  disabled
                  className="p-2 border rounded w-full bg-gray-100"
                />
              </div>

              <div className="mt-2">
                <label className="block text-gray-700 font-medium">
                  Discount
                </label>
                <input
                  type="number"
                  name="discountAmount"
                  placeholder="Discount"
                  value={form.discountAmount}
                  onChange={handleChange}
                  className="p-2 border rounded w-full bg-white"
                />
              </div>

              <div className="mt-2">
                <label className="block text-gray-700 font-medium">
                  Penalties
                </label>
                <input
                  type="number"
                  name="penaltyAmount"
                  placeholder="Discount"
                  value={form.penaltyAmount}
                  onChange={handleChange}
                  className="p-2 border rounded w-full bg-white"
                />
              </div>

            </>
          )}

          {/* Step 3: Final Computation */}
          {step === 3 && (
            <>
              <h3 className="text-xl font-bold mt-6">Invoice Summary</h3>

              <div className="mt-2 p-6 border border-gray-300 rounded-lg bg-gray-50 shadow-md">
                <div className="flex justify-between border-b pb-2 mb-2">
                  <p className="text-gray-700 font-medium">Reading Date:</p>
                  <p>{form.readingDate || "N/A"}</p>
                </div>

                {/* Electricity */}
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    Electricity Charges
                  </h4>
                  <div className="flex justify-between">
                    <p>Usage:</p>
                    <p>{calculateUtilityBill().electricity.usage} kWh</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Rate per kWh:</p>
                    <p>₱{calculateUtilityBill().electricity.rate}</p>
                  </div>
                  <div className="flex justify-between font-bold">
                    <p>Total Cost:</p>
                    <p>₱{calculateUtilityBill().electricity.cost}</p>
                  </div>
                </div>

                {/* Water */}
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    Water Charges
                  </h4>
                  <div className="flex justify-between">
                    <p>Usage:</p>
                    <p>{calculateUtilityBill().water.usage} m³</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Rate per m³:</p>
                    <p>₱{calculateUtilityBill().water.rate}</p>
                  </div>
                  <div className="flex justify-between font-bold">
                    <p>Total Cost:</p>
                    <p>₱{calculateUtilityBill().water.cost}</p>
                  </div>
                </div>

                {/* Other Charges */}
                <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    Additional Charges
                  </h4>
                  <div className="flex justify-between">
                    <p>Rent Amount:</p>
                    <p>₱{unit?.rent_amount}</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Association Dues:</p>
                    <p>₱{calculateUtilityBill().associationDues}</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Late Fee(%):</p>
                    <p>₱{calculateUtilityBill().lateFee}</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Discount:</p>
                    <p>₱{calculateUtilityBill().discountAmount}</p>
                  </div>
                  <div className="flex justify-between">
                    <p>Penalties:</p>
                    <p>₱{calculateUtilityBill().penaltyAmount}</p>
                  </div>
                </div>

                {/* Total Due */}
                <div className="bg-blue-100 p-4 rounded-lg shadow-md border">
                  <div className="flex justify-between text-lg font-bold text-blue-800">
                    <p>Total Amount Due:</p>
                    <p>₱{calculateUtilityBill().total}</p>
                  </div>
                </div>
              </div>
            </>
          )}
          {/* Navigation Buttons */}
          <div className="mt-4 flex justify-between">
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Previous
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Next
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-green-500 text-white rounded"
                onClick={handleSubmit}
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
