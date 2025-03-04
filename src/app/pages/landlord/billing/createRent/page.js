"use client";
import { useState } from "react";
import { IoIosArrowBack } from "react-icons/io";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const PaymentDetailsPage = () => {
  const [rent, setRent] = useState(12000);
  const [lateFees, setLateFees] = useState(0);
  const [billGenerated, setBillGenerated] = useState(false);
  const tenantName = "Aidan Claude Tsang";
  const paymentStatus = "Unpaid";
  const router = useRouter();

  const billTotal = rent + lateFees;

  const handleGenerateBill = () => {
    setBillGenerated(true);
    
    // Show success message for 2 seconds, then redirect
    setTimeout(() => {
      router.push("/pages/landlord/billing");
    }, 2000);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => router.push("/pages/landlord/billing")}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors mr-2"
          >
            <IoIosArrowBack size={24} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Create Payment Details
          </h1>
        </div>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Side: Tenant Details & Rent Payment */}
          <div className="md:w-1/2 space-y-6">
            {/* Tenant Details */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="border-b border-gray-100 p-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Tenant Details
                </h2>
              </div>
              <div className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="py-3 px-4 font-medium text-gray-600">Name</th>
                      <th className="py-3 px-4 font-medium text-gray-600">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-4 px-4 font-medium text-gray-800">{tenantName}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1.5"></span>
                          {paymentStatus}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Rent Payment */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Rent Payment
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="rent"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    RENT AMOUNT
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="rent"
                      className="pl-8 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg py-3 bg-white text-gray-700"
                      value={rent}
                      onChange={(e) => setRent(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="late-fees"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    LATE FEES
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="late-fees"
                      className="pl-8 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 text-lg py-3 bg-white text-gray-700"
                      value={lateFees}
                      onChange={(e) => setLateFees(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Side: Generate Bill & Bill Summary */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="md:w-1/2"
          >
            <div className="bg-white rounded-xl shadow-md p-6">
              {!billGenerated ? (
                <button
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center font-semibold text-lg"
                  onClick={handleGenerateBill}
                >
                  Generate Bill
                </button>
              ) : (
                <div className="w-full bg-green-600 text-white py-3 px-4 rounded-lg flex items-center justify-center font-semibold text-lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Bill Generated Successfully!
                </div>
              )}
              
              <p className="text-sm text-gray-600 mt-4 mb-6 text-center">
                Make sure to double check everything before generating your bill.
              </p>

              <hr className="border-gray-200 mb-6" />

              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Bill Summary
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-gray-600 font-medium">Rent</span>
                  <span className="text-gray-800 font-medium">${rent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-gray-600 font-medium">Late Fees</span>
                  <span className="text-gray-800 font-medium">${lateFees.toLocaleString()}</span>
                </div>
              </div>

              <hr className="border-gray-200 my-6" />

              <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                <span className="text-lg font-semibold text-gray-800">
                  Bill Total:
                </span>
                <span className="text-xl font-bold text-blue-600">
                  ${billTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsPage;