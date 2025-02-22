import React from "react";
import { FaMoneyBillWave, FaArrowLeft } from "react-icons/fa"; // Import react-icons

const BillingSystem = () => {
  return (
    <div className="font-sans antialiased bg-gray-50">
      {/* Header */}
      <div className="flex items-center py-4 pl-6 bg-white shadow-md">
        <FaMoneyBillWave className="w-6 h-6 mr-2 text-indigo-600" />
        <h1 className="text-xl font-semibold text-gray-800">
          Property Billing System
        </h1>
      </div>

      {/* Main Content */}
      <div className="container mx-auto mt-8 px-4 lg:px-8">
        {/* Back Button and Title */}
        <div className="flex items-center mb-6">
          <FaArrowLeft className="w-6 h-6 mr-2 text-gray-600 cursor-pointer" />
          <h2 className="text-2xl font-semibold text-gray-800">
            Create Payment Details
          </h2>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side: Details Form */}
          <div>
            {/* Tenant Details */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Tenant Details
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Aidan Claude Tsang
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          • Unpaid
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Details */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Bill Details
              </h3>

              <div>
                <label
                  htmlFor="previousReading"
                  className="block text-sm font-medium text-gray-700"
                >
                  Previous Reading
                </label>
                <input
                  type="number"
                  id="previousReading"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="presentReading"
                  className="block text-sm font-medium text-gray-700"
                >
                  Present Reading
                </label>
                <input
                  type="number"
                  id="presentReading"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="associationDues"
                  className="block text-sm font-medium text-gray-700"
                >
                  Association Dues
                </label>
                <input
                  type="number"
                  id="associationDues"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="totalBillAmount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Total Bill Amount
                </label>
                <input
                  type="number"
                  id="totalBillAmount"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="totalConsumption"
                  className="block text-sm font-medium text-gray-700"
                >
                  Total Consumption (KPH / Cubic Meter)
                </label>
                <input
                  type="number"
                  id="totalConsumption"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Bill Summary and Button */}
          <div className="bg-white shadow rounded-lg p-6">
            {/* Generate Bill Button */}
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-md shadow-md transition duration-300 ease-in-out">
              Generate Bill
            </button>

            {/* Instruction */}
            <p className="text-sm text-gray-500 mt-4">
              Make sure to double check everything before generating your bill.
            </p>

            {/* Utility Bill Summary */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Utility Bill Summary
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Water</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Price/Cubic Meter</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Present Reading</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Previous Reading</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Bill</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Consumption</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Price/KWH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Association Dues</span>
                </div>
              </div>

              {/* Bill Total */}
              <div className="border-t border-gray-200 mt-6 pt-4 flex justify-between items-center">
                <span className="text-lg font-medium text-gray-800">
                  Bill Total:
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSystem;
