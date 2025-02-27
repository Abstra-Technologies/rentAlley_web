"use client";

import Image from "next/image";
import { useState } from "react";
import { IoIosArrowBack, IoMdCloudUpload } from "react-icons/io";

const BillingPaymentPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <IoIosArrowBack size={24} className="mr-2 cursor-pointer" />
            <h1 className="text-2xl font-semibold text-gray-800">
              Billing Payment
            </h1>
          </div>
          <h2 className="text-lg text-gray-700">XYZ Residences . Unit 707</h2>
        </div>

        {/* Bills Section - Grid layout for responsiveness */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rent Bill */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Rent Bill
            </h3>
            <div className="flex justify-between">
              <div>
                <p className="text-gray-600">FROM: May 1, 2024</p>
                <p className="text-gray-600">TO: June 1, 2024</p>
              </div>
            </div>
            <p className="text-gray-600 mt-2">Monthly Rental Payment</p>
            <div className="flex justify-between items-center mt-4">
              <span className="text-gray-800">₱10,000</span>
              <span className="bg-red-500 text-white py-1 px-3 rounded-full text-sm">
                Unpaid
              </span>
            </div>
          </div>

          {/* Utility Bills */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Utility Bills
            </h3>
            <div className="flex justify-between">
              <div>
                <p className="text-gray-600">FROM: May 1, 2024</p>
                <p className="text-gray-600">TO: June 1, 2024</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-gray-600">
                WATER CONSUMPTION <span className="float-right">₱1,234</span>
              </p>
              <p className="text-gray-600">
                ELECTRICITY BILL <span className="float-right">₱7,123</span>
              </p>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-gray-700 font-semibold">Total Payment</span>
              <span className="text-gray-800 font-semibold">₱8,123</span>
              <span className="bg-red-500 text-white py-1 px-3 rounded-full text-sm">
                Unpaid
              </span>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Payment option
          </h3>
          <div className="flex items-center mb-2">
            <span className="mr-2 flex items-center h-5">
              {" "}
              <Image
                src="https://mir-s3-cdn-cf.behance.net/projects/404/788fe9190546715.Y3JvcCwyNTYwLDIwMDIsMCwxOTA.png"
                width={30}
                height={30}
                alt="Maya logo"
                className="object-cover"
              />
            </span>
            <span className="text-gray-700 font-semibold">Maya</span>
          </div>
          <p className="text-gray-600 mb-4">We Accept Paymaya payment.</p>

          <button
            onClick={openModal}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <IoMdCloudUpload size={30} className="mr-2" />
            Proof of Payment
          </button>
          <p className="text-gray-500 text-sm mt-1">
            Upload your proof of payment.
          </p>
          <p className="text-gray-500 text-xs mt-1">
            NOTE: After paying through check or cash, please show the receipt
            for proof of payment.
          </p>
        </div>

        {/* Proof of Payment Modal */}
        {isModalOpen && (
          <div className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 max-w-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                PROOF OF PAYMENT SUBMISSION
              </h2>
              <p className="text-gray-700 mb-2">
                Instructions: Submit your proof of payment below.
              </p>
              <p className="text-gray-700 mb-4">
                Dropbox Below: Submit all requirements below. Thank you!
              </p>

              {/* Dropbox area */}
              <div className="border-2 border-dashed border-gray-400 rounded-md p-8 text-center">
                <IoMdCloudUpload size={48} className="mx-auto text-gray-500" />
                <p className="text-gray-600 mt-2">
                  Drag & drop files or{" "}
                  <button className="text-blue-600">Browse</button>
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Supported formats: JPEG and PNG
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded mr-2"
                >
                  Cancel
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPaymentPage;
