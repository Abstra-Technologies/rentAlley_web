"use client";
import { useState } from "react";
import LandlordLayout from "../../../../../components/navigation/sidebar-landlord";

export default function BillingHistory() {
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Dummy data (representing data from MeterReading, ConcessionaireBilling, and Billing tables)
  const billingHistory = [
    {
      id: 1, // billing_id from Billing table
      billingPeriod: "February 2025", // billing_period from Billing table
      rent: 10000,
      penalties: 200, // penalty_amount from Billing table
      discounts: 100, // discount_amount from Billing table
      total: 12100, // total_amount_due from Billing table
      status: "unpaid", // status from Billing table
      dueDate: "2025-03-15", // due_date from Billing table
      waterReadings: {
        // Data from MeterReading and ConcessionaireBilling for water
        previousReading: 100.5,
        currentReading: 105.75,
        totalConsumed: 5.25, // Calculated: currentReading - previousReading
        rateConsumed: 25.0, // rate_consumed from ConcessionaireBilling table
        totalWaterAmount: 131.25, // total_water_amount from Billing table
      },
      electricityReadings: {
        // Data from MeterReading and ConcessionaireBilling for electricity
        previousReading: 2500.2,
        currentReading: 2650.8,
        totalConsumed: 150.6, // Calculated: currentReading - previousReading
        rateConsumed: 10.5, // rate_consumed from ConcessionaireBilling table
        totalElectricityAmount: 1581.3, // total_electricity_amount from Billing table
      },
    },
  ];

  return (
    <LandlordLayout>
      <div className="p-6 w-full bg-gray-50">
        <h1 className="text-2xl font-bold text-blue-900 mb-4">
          Billing History
        </h1>

        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Billing Period",
                  "Rent",
                  "Penalties",
                  "Discounts",
                  "Total",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {billingHistory.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {bill.billingPeriod}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    ₱{bill.rent}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    ₱{bill.penalties}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    ₱{bill.discounts}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    ₱{bill.total}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        bill.status === "unpaid"
                          ? "bg-red-200 text-red-700"
                          : bill.status === "paid"
                          ? "bg-green-200 text-green-700"
                          : "bg-yellow-200 text-yellow-700"
                      }`}
                    >
                      {bill.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedInvoice(bill)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md shadow-md hover:bg-blue-700 transition"
                    >
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[700px] max-w-full max-h-[90vh] overflow-y-auto mt-8">
              <h2 className="text-lg font-bold mb-4 text-blue-900">
                Invoice Details - {selectedInvoice.billingPeriod}
              </h2>

              {/* Billing Summary */}
              <section className="mb-4 border-b pb-2">
                <h3 className="text-md font-semibold mb-2">Billing Summary</h3>
                <p className="text-sm">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`font-medium ${
                      selectedInvoice.status === "unpaid"
                        ? "text-red-700"
                        : selectedInvoice.status === "paid"
                        ? "text-green-700"
                        : "text-yellow-700"
                    }`}
                  >
                    {selectedInvoice.status.toUpperCase()}
                  </span>
                </p>
                <p className="text-sm">
                  <strong>Due Date:</strong> {selectedInvoice.dueDate}
                </p>
              </section>

              {/* Rent Details */}
              <section className="mb-4 border-b pb-2">
                <h3 className="text-md font-semibold mb-2">Rent Details</h3>
                <p className="text-sm">
                  <strong>Rent:</strong> ₱{selectedInvoice.rent}
                </p>
              </section>

              {/* Water Details */}
              <section className="mb-4 border-b pb-2">
                <h3 className="text-md font-semibold mb-2">Water Details</h3>
                <p className="text-sm">
                  <strong>Previous Reading:</strong>{" "}
                  {selectedInvoice.waterReadings.previousReading}
                </p>
                <p className="text-sm">
                  <strong>Current Reading:</strong>{" "}
                  {selectedInvoice.waterReadings.currentReading}
                </p>
                <p className="text-sm">
                  <strong>Total Consumed:</strong>{" "}
                  {selectedInvoice.waterReadings.totalConsumed}
                </p>
                <p className="text-sm">
                  <strong>Rate Consumed:</strong> ₱
                  {selectedInvoice.waterReadings.rateConsumed}
                </p>
                <p className="text-sm">
                  <strong>Total Water Amount:</strong> ₱
                  {selectedInvoice.waterReadings.totalWaterAmount}
                </p>
              </section>

              {/* Electricity Details */}
              <section className="mb-4 border-b pb-2">
                <h3 className="text-md font-semibold mb-2">
                  Electricity Details
                </h3>
                <p className="text-sm">
                  <strong>Previous Reading:</strong>{" "}
                  {selectedInvoice.electricityReadings.previousReading}
                </p>
                <p className="text-sm">
                  <strong>Current Reading:</strong>{" "}
                  {selectedInvoice.electricityReadings.currentReading}
                </p>
                <p className="text-sm">
                  <strong>Total Consumed:</strong>{" "}
                  {selectedInvoice.electricityReadings.totalConsumed}
                </p>
                <p className="text-sm">
                  <strong>Rate Consumed:</strong> ₱
                  {selectedInvoice.electricityReadings.rateConsumed}
                </p>
                <p className="text-sm">
                  <strong>Total Electricity Amount:</strong> ₱
                  {selectedInvoice.electricityReadings.totalElectricityAmount}
                </p>
              </section>

              {/* Additional Charges/Discounts */}
              <section className="mb-4 border-b pb-2">
                <h3 className="text-md font-semibold mb-2">
                  Additional Charges/Discounts
                </h3>
                <p className="text-sm">
                  <strong>Penalties:</strong> ₱{selectedInvoice.penalties}
                </p>
                <p className="text-sm">
                  <strong>Discounts:</strong> ₱{selectedInvoice.discounts}
                </p>
              </section>

              {/* Total Amount Due */}
              <section className="mb-4">
                <h3 className="text-md font-semibold mb-2">Total Amount Due</h3>
                <p className="font-semibold text-sm">
                  <strong>Total:</strong> ₱{selectedInvoice.total}
                </p>
              </section>

              {/* Close Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
}
