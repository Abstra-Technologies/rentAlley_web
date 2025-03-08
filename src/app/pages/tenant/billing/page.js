"use client";

import Image from "next/image";
import { useState } from "react";
import { IoIosArrowBack, IoMdCloudUpload } from "react-icons/io";
import TenantLayout from "../../../../components/navigation/sidebar-tenant";


//orignal layout.

// const BillingPaymentPage = () => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//
//   const openModal = () => setIsModalOpen(true);
//   const closeModal = () => setIsModalOpen(false);
//
//   return (
//     <TenantLayout>
//       <div className="bg-gray-50 min-h-screen">
//         <div className="container mx-auto py-10 px-4 max-w-5xl">
//           {/* Header Section with improved spacing and styling */}
//           <div className="mb-8">
//             <div className="flex items-center mb-3">
//               <button className="p-2 mr-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
//                 <IoIosArrowBack size={22} className="text-blue-600" />
//               </button>
//               <h1 className="text-2xl font-bold text-blue-600">
//                 Billing Payment
//               </h1>
//             </div>
//             <h2 className="text-lg text-customBlue font-semibold pl-1">XYZ Residences • Unit 707</h2>
//           </div>
//
//           {/* Bills Section - Improved cards with better spacing */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {/* Rent Bill - Enhanced card */}
//             <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100">
//               <h3 className="text-xl font-semibold text-customBlue mb-4">
//                 Rent Bill
//               </h3>
//               <div className="flex justify-between mb-4">
//                 <div className="space-y-1">
//                   <p className="text-gray-600 font-medium">FROM: <span className="font-normal">May 1, 2024</span></p>
//                   <p className="text-gray-600 font-medium">TO: <span className="font-normal">June 1, 2024</span></p>
//                 </div>
//               </div>
//               <p className="text-gray-600 mb-4">Monthly Rental Payment</p>
//               <div className="flex justify-between items-center mt-6">
//                 <span className="text-gray-800 text-xl font-bold">₱10,000</span>
//                 <span className="bg-red-500 text-white py-1 px-4 rounded-full text-sm font-medium">
//                   Unpaid
//                 </span>
//               </div>
//             </div>
//
//             {/* Utility Bills - Enhanced card */}
//             <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 border border-gray-100">
//               <h3 className="text-xl font-semibold text-customBlue mb-4">
//                 Utility Bills
//               </h3>
//               <div className="flex justify-between mb-4">
//                 <div className="space-y-1">
//                   <p className="text-gray-600 font-medium">FROM: <span className="font-normal">May 1, 2024</span></p>
//                   <p className="text-gray-600 font-medium">TO: <span className="font-normal">June 1, 2024</span></p>
//                 </div>
//               </div>
//               <div className="space-y-2 mb-4">
//                 <div className="flex justify-between text-gray-600">
//                   <span>WATER CONSUMPTION</span>
//                   <span>₱1,234</span>
//                 </div>
//                 <div className="flex justify-between text-gray-600">
//                   <span>ELECTRICITY BILL</span>
//                   <span>₱7,123</span>
//                 </div>
//                 <div className="border-t border-gray-200 my-2"></div>
//               </div>
//               <div className="flex justify-between items-center mt-4">
//                 <span className="text-gray-700 font-semibold">
//                   Total Payment
//                 </span>
//                 <div className="flex items-center space-x-3">
//                   <span className="text-gray-800 text-xl font-bold">₱8,123</span>
//                   <span className="bg-red-500 text-white py-1 px-4 rounded-full text-sm font-medium">
//                     Unpaid
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//
//           {/* Payment Options - Enhanced section */}
//           <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6 mt-6 border border-gray-100">
//             <h3 className="text-xl font-semibold text-customBlue mb-5">
//               Payment Option
//             </h3>
//             <div className="flex items-center mb-3">
//               <div className="w-10 h-10 mr-3 flex items-center justify-center bg-gray-50 rounded-full">
//                 <Image
//                   src="https://mir-s3-cdn-cf.behance.net/projects/404/788fe9190546715.Y3JvcCwyNTYwLDIwMDIsMCwxOTA.png"
//                   width={30}
//                   height={30}
//                   alt="Maya logo"
//                   className="object-cover"
//                 />
//               </div>
//               <span className="text-customBlue font-semibold">Maya</span>
//             </div>
//             <p className="text-gray-600 mb-6 pl-1">We Accept Paymaya payment.</p>
//
//             <button
//               onClick={openModal}
//               className="flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 transition-colors duration-200 py-2 px-4 rounded-lg"
//             >
//               <IoMdCloudUpload size={24} className="mr-2" />
//               <span className="font-medium">Upload Proof of Payment</span>
//             </button>
//             <p className="text-gray-500 text-sm mt-3 pl-1">
//               Upload your proof of payment.
//             </p>
//             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 rounded">
//               <p className="text-gray-600 text-sm">
//                 <span className="font-medium">NOTE:</span> After paying through check or cash, please show the receipt for proof of payment.
//               </p>
//             </div>
//           </div>
//
//           {/* Enhanced Modal */}
//           {isModalOpen && (
//             <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//               <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full animate-fadeIn">
//                 <h2 className="text-xl font-bold text-blue-600 mb-4">
//                   Proof of Payment Submission
//                 </h2>
//                 <p className="text-gray-600 mb-2">
//                   Instructions: Submit your proof of payment below.
//                 </p>
//                 <p className="text-gray-700 mb-6">
//                   Dropbox Below: Submit all requirements below. Thank you!
//                 </p>
//
//                 {/* Enhanced Dropbox area */}
//                 <div className="border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors duration-200 rounded-lg p-8 text-center cursor-pointer">
//                   <IoMdCloudUpload
//                     size={48}
//                     className="mx-auto text-blue-500"
//                   />
//                   <p className="text-gray-600 mt-3 font-medium">
//                     Drag & drop files or{" "}
//                     <button className="text-blue-600 hover:text-blue-700 hover:underline">Browse</button>
//                   </p>
//                   <p className="text-gray-500 text-sm mt-2">
//                     Supported formats: JPEG and PNG
//                   </p>
//                 </div>
//
//                 <div className="mt-8 flex justify-end space-x-3">
//                   <button
//                     onClick={closeModal}
//                     className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
//                   >
//                     Cancel
//                   </button>
//                   <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200">
//                     Submit
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </TenantLayout>
//   );
// };
// export default BillingPaymentPage;


import { useEffect } from "react";
import axios from "axios";
import useAuth from "../../../../../hooks/useSession";
import Swal from "sweetalert2";

export default function TenantBilling({ }) {
  const [billingData, setBillingData] = useState([]);
  const [meterReadings, setMeterReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const {user} = useAuth();
const tenant_id = user?.tenant_id;
  useEffect(() => {
    if (!tenant_id) return;

    const fetchBillingData = async () => {
      try {
        const res = await axios.get(`/api/tenant/billing/view?tenant_id=${tenant_id}`);
        setBillingData(res.data.billings || []);
        setMeterReadings(res.data.meterReadings || []);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch billing records.");
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [tenant_id]);

  const handlePayment = async ( amount, billing_id) => {
    const result = await Swal.fire({
      title: "Billing Payment",
      text: `Are you sure you want to pay your current billing?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Pay Now",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed){
      setLoadingPayment(true);
      try {
        const res = await axios.post("/api/tenant/billing/payment", {
          amount,
          billing_id,
          tenant_id,
          payment_method_id: 1,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          redirectUrl: {
            success:  "http://localhost:3000/pages/payment/billSuccess",
            failure: "http://localhost:3000/pages/payment/billFailed",
            cancel: "http://localhost:3000/pages/payment/billCancelled",
          },
        });

        if (res.data.checkoutUrl) {
          window.location.href = res.data.checkoutUrl;
        }
      } catch (error) {
        console.error("Payment error:", error);
        alert("Failed to process payment.");
      }
    }

  };

  if (loading) return <p className="text-gray-500">Loading billing records...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (billingData.length === 0) return <p className="text-gray-500">No billing records found.</p>;



  return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Your Current Billing</h1>
        {billingData.map((bill) => (
            <div key={bill.billing_id} className="p-4 border rounded-lg bg-white shadow-md mb-4">
              <p>Billing DATA: {bill?.billing_id}</p>

              <h2 className="text-lg font-semibold">
                {bill.unit_name} - {bill.billing_period}
              </h2>
              <p className="text-gray-600">Status: <span className="font-bold">{bill.status}</span></p>
              <p className="text-gray-600">Total Amount Due: <span className="font-bold">₱{bill.total_amount_due}</span></p>
              <p className="text-gray-600">Due Date: {bill.due_date}</p>
              {bill.paid_at ? (
                  <p className="text-green-600">Paid on: {bill.paid_at}</p>
              ) : (
                  <p className="text-red-600">Not yet paid</p>
              )}

              {/* Display Meter Readings */}
              <div className="mt-4">
                <h3 className="text-md font-semibold">Meter Readings</h3>
                {meterReadings
                    .filter((reading) => reading.unit_id === bill.unit_id)
                    .map((reading, index) => (
                        <div key={index} className="mt-2 p-2 border bg-gray-100 rounded-lg">
                          <p className="text-gray-700">Utility: {reading.utility_type.toUpperCase()}</p>
                          <p>Previous Reading: {reading.previous_reading}</p>
                          <p>Current Reading: {reading.current_reading}</p>
                          <p>Reading Date: {reading.reading_date}</p>
                        </div>
                    ))}
              </div>

              <h2>Payment</h2>
              {bill.status === "unpaid" && (
                  <button
                      onClick={() => handlePayment(bill?.total_amount_due, bill?.billing_id)}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Pay Now
                  </button>
              )}
            </div>
        ))}

      </div>
  );
}
