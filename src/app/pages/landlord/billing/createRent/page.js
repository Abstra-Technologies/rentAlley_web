"use client";
import { useState } from "react";
import { IoIosArrowBack } from "react-icons/io";

const PaymentDetailsPage = () => {
  const [rent, setRent] = useState(12000);
  const [lateFees, setLateFees] = useState(0);
  const [billGenerated, setBillGenerated] = useState(false);
  const tenantName = "Aidan Claude Tsang";
  const paymentStatus = "Unpaid";

  const billTotal = rent + lateFees;

  const handleGenerateBill = () => {
    setBillGenerated(true); // Simulate bill generation
  };

  return (
    <div className="bg-white min-h-screen py-6">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center mb-6">
          <IoIosArrowBack size={24} className="mr-2 cursor-pointer" />
          <h1 className="text-2xl font-semibold text-gray-800">
            Create Payment Details
          </h1>
        </div>

        {/* Main Content - Flex Container */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Side: Tenant Details & Rent Payment */}
          <div className="md:w-1/2">
            {/* Tenant Details */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Tenant Details
              </h2>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 font-semibold text-left text-gray-700">
                        Name
                      </th>
                      <th className="py-2 px-4 font-semibold text-left text-gray-700">
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-4">{tenantName}</td>
                      <td className="py-2 px-4">
                        <span className="inline-flex items-center">
                          <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></span>
                          {paymentStatus}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rent Payment */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Rent Payment
              </h2>
              <div className="space-y-2">
                <div>
                  <label
                    htmlFor="rent"
                    className="block text-sm font-medium text-gray-700"
                  >
                    RENT
                  </label>
                  <input
                    type="number"
                    id="rent"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg py-3 bg-gray-50 text-gray-500 cursor-not-allowed"
                    value={rent}
                    disabled
                    onChange={(e) => setRent(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="late-fees"
                    className="block text-sm font-medium text-gray-700"
                  >
                    LATE FEES (%)
                  </label>
                  <input
                    type="number"
                    id="late-fees"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg py-3 bg-gray-50 text-gray-500 cursor-not-allowed"
                    value={lateFees}
                    disabled
                    onChange={(e) => setLateFees(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Generate Bill & Bill Summary */}
          <div className="md:w-1/2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <button
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-200"
                onClick={handleGenerateBill}
              >
                Generate Bill
              </button>
              <p className="text-sm text-gray-600 mt-4 mb-6 text-center">
                Make sure to double check everything before generating your
                bill.
              </p>

              <hr className="border-gray-200 mb-4" />

              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                Bill Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rent</span>
                  <span className="text-gray-800">{rent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Late Fees</span>
                  <span className="text-gray-800">
                    {lateFees.toLocaleString()}
                  </span>
                </div>
              </div>

              <hr className="border-gray-200 mt-4 mb-4" />

              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">
                  Bill Total:
                </span>
                <span className="text-lg font-semibold text-gray-800">
                  {billTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsPage;
