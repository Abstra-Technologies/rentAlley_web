"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import LandlordLayout from "../../../../../components/navigation/sidebar-landlord";

export default function EditUnitBill() {
  const { bill_id } = useParams();
  const [bill, setBill] = useState({
    readingDate: "2025-03-10",
    waterPrevReading: "100",
    waterCurrentReading: "120",
    electricityPrevReading: "300",
    electricityCurrentReading: "340",
    totalWaterAmount: "50",
    totalElectricityAmount: "80",
    penaltyAmount: "10",
    discountAmount: "5",
    totalAmountDue: "1000",
    rentAmount: "800",
    associationDues: "50",
    lateFee: "20",
    dueDate: "2025-03-20",
  });
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    setBill({ ...bill, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  return (
    <LandlordLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold">Edit Unit Bill</h1>

        <div className="mt-6 p-4 border rounded-lg bg-white">
          <h2 className="text-lg font-semibold">Edit Bill (Step {step}/3)</h2>

          {/* Step 1: Readings (if applicable) */}
          {step === 1 && (
            <div>
              <label className="block text-gray-700 font-medium">
                Reading Date
              </label>
              <input
                type="date"
                name="readingDate"
                value={bill.readingDate}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
              <input
                type="number"
                name="waterPrevReading"
                value={bill.waterPrevReading}
                onChange={handleChange}
                className="mt-2 p-2 border rounded w-full"
              />
              <input
                type="number"
                name="waterCurrentReading"
                value={bill.waterCurrentReading}
                onChange={handleChange}
                className="mt-2 p-2 border rounded w-full"
              />
            </div>
          )}

          {/* Step 2: Rent Amt, Penalties, etc... */}
          {step === 2 && (
            <div>
              <label className="block text-gray-700 font-medium">
                Rent Amount
              </label>
              <input
                type="number"
                name="rentAmount"
                value={bill.rentAmount}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
              <label className="block text-gray-700 font-medium mt-2">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={bill.dueDate}
                onChange={handleChange}
                className="p-2 border rounded w-full"
              />
            </div>
          )}

          {/* System Calculation */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-bold mt-4">Bill Summary</h3>
              <p>Total Amount Due: ${bill.totalAmountDue}</p>
            </div>
          )}

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
              <button className="px-4 py-2 bg-green-500 text-white rounded">
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
