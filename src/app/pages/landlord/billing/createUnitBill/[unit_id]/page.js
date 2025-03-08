"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";

export default function CreateUnitBill() {
  const { unit_id } = useParams();
  const [unit, setUnit] = useState(null);
  const [property, setProperty] = useState(null);
  const [billingHistory, setBillingHistory] = useState([
    {
      due_date: "2025-03-15",
      total_amount_due: "1500",
    },
  ]);
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
          throw new Error("Missing unit or property data");
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

        // setBillingHistory(data.billingHistory);
      } catch (error) {
        console.error("Error fetching unit data:", error);
      }
    }

    fetchUnitData();
  }, [unit_id]);

  const calculateUtilityBill = () => {
    // Ensure readings are numbers, fallback to 0 if empty
    const electricityPrevReading = parseFloat(form.electricityPrevReading) || 0;
    const electricityCurrentReading = parseFloat(form.electricityCurrentReading) || 0;
    const waterPrevReading = parseFloat(form.waterPrevReading) || 0;
    const waterCurrentReading = parseFloat(form.waterCurrentReading) || 0;

    // Use property-wide rates (fetched from API and stored in `propertyRates`)
    const electricityRate = parseFloat(propertyRates.electricityRate) || 0;
    const waterRate = parseFloat(propertyRates.waterRate) || 0;

    // Calculate usage
    const electricityUsage = Math.max(0, electricityCurrentReading - electricityPrevReading);
    const waterUsage = Math.max(0, waterCurrentReading - waterPrevReading);

    // Calculate cost using fetched property-wide rates
    const electricityCost = electricityUsage * electricityRate;
    const waterCost = waterUsage * waterRate;

    // Other costs
    const rentAmount = parseFloat(unit?.rent_amount) || 0;
    const associationDues = parseFloat(unit?.associationDues) || 0;
    const lateFee = parseFloat(unit?.lateFee) || 0;

    // Compute total bill
    const total = electricityCost + waterCost + rentAmount + associationDues + lateFee;

    return {
      electricity: {
        usage: electricityUsage,
        rate: electricityRate.toFixed(2),
        cost: electricityCost.toFixed(2)
      },
      water: {
        usage: waterUsage,
        rate: waterRate.toFixed(2),
        cost: waterCost.toFixed(2)
      },
      rentAmount: rentAmount.toFixed(2),
      associationDues: associationDues.toFixed(2),
      lateFee: lateFee.toFixed(2),
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
        totalElectricityAmount: parseFloat(calculateUtilityBill().electricity.cost) || 0,
        penaltyAmount: parseFloat(form.penaltyAmount) || 0,
        discountAmount: parseFloat(form.discountAmount) || 0,
        dueDate: form.dueDate,
        unit_id: unit.unit_id,
        waterPrevReading: form.waterPrevReading,
        waterCurrentReading: form.waterCurrentReading,
        electricityPrevReading: form.electricityPrevReading,
        electricityCurrentReading: form.electricityCurrentReading,
        total_amount_due: parseFloat(calculateUtilityBill().total)
      };

      const res = await axios.post("/api/billing/create", billingData);

      if (res.status === 201) {
        alert("Billing saved successfully!");
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
          <h2 className="text-lg font-semibold">Billing History</h2>
          {billingHistory.length > 0 ? (
            billingHistory.map((bill, index) => (
              <div key={index} className="mt-2 p-2 border-b">
                <p>Due Date: {bill.due_date}</p>
                <p>Total Amount: {bill.total_amount_due}</p>
              </div>
            ))
          ) : (
            <p>No billing records found.</p>
          )}
        </div>

        <p>Water Rate: ₱{propertyRates?.waterRate} per m³</p>
        <p>Electricity Rate: ₱{propertyRates?.electricityRate} per kWh</p>

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
                  <input
                    type="number"
                    name="waterPrevReading"
                    placeholder="Previous Water Reading"
                    value={form.waterPrevReading}
                    onChange={handleChange}
                    className="mt-2 p-2 border rounded w-full"
                  />
                  <input
                    type="number"
                    name="waterCurrentReading"
                    placeholder="Current Water Reading"
                    value={form.waterCurrentReading}
                    onChange={handleChange}
                    className="mt-2 p-2 border rounded w-full"
                  />
                  <input
                    type="number"
                    name="electricityPrevReading"
                    placeholder="Previous Electricity Reading"
                    value={form.electricityPrevReading}
                    onChange={handleChange}
                    className="mt-2 p-2 border rounded w-full"
                  />
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
                  name="associationDues"
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
            </>
          )}

          {/* Step 3: Final Computation */}
          {step === 3 && (
            <>
              <h3 className="text-lg font-bold mt-4">Bill Summary</h3>
              <div className="mt-2 p-4 border rounded-lg bg-gray-100">
                <p>
                  Electricity Usage: {calculateUtilityBill().electricity.usage}{" "}
                  kWh
                </p>
                <p>
                  Electricity Cost: $
                  {calculateUtilityBill().electricity.cost}
                </p>
                <p>Water Usage: {calculateUtilityBill().water.usage} m³</p>
                <p>
                  Water Cost: ${calculateUtilityBill().water.cost}
                </p>
                <p>
                  Rent Amount: ${unit?.rent_amount}
                </p>
                <p>
                  Association Dues: $
                  {calculateUtilityBill().associationDues}
                </p>
                <p>
                 Water Rate this Month: $
                  {propertyRates?.waterRate}
                </p>
                <p>
                  Electricity Rate this Month: $
                  {propertyRates?.electricityRate}
                </p>
                <p>Late Fee: ${calculateUtilityBill().lateFee}</p>
                <hr className="my-2" />
                <p className="text-lg font-bold">
                  Total Amount Due: ${calculateUtilityBill().total}
                </p>
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
              <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={handleSubmit}>
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
