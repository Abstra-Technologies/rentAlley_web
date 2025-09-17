"use client";
import { useEffect, useState } from "react";

const PaymentList = ({ landlord_id }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!landlord_id) return;

    const fetchPayments = async () => {
      try {
        const response = await fetch(
          `/api/landlord/payments/getPaymentList?landlord_id=${landlord_id}`
        );
        const data = await response.json();

        if (response.ok) {
          setPayments(data);
        } else {
          new Error(data.error || "Failed to fetch payments");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [landlord_id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 text-lg animate-pulse">
          Loading payments...
        </div>
      </div>
    );
  }

  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 shadow-xl rounded-2xl">
        {payments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                <div className="text-4xl mb-2">💸</div>
                <p className="text-sm font-medium text-gray-700">No payments found</p>
                <p className="text-xs text-gray-500 mt-1">
                  Tenant payments will appear here once available.
                </p>
              </div>
            </div>
        ) : (
            <div className="overflow-x-auto">
              {/* Table for medium and larger screens */}
              <table className="hidden md:table w-full border-separate border-spacing-y-2">
                <thead>
                <tr className="bg-white/70 backdrop-blur-sm text-left text-sm text-gray-700 rounded-lg">
                  <th className="p-3 font-semibold">Property</th>
                  <th className="p-3 font-semibold">Unit</th>
                  <th className="p-3 font-semibold">Payment Type</th>
                  <th className="p-3 font-semibold">Amount</th>
                </tr>
                </thead>
                <tbody>
                {payments.map((payment) => (
                    <tr
                        key={payment.payment_id}
                        className="bg-white/80 backdrop-blur-sm hover:bg-white transition rounded-lg shadow-sm"
                    >
                      <td className="p-3">{payment.property_name}</td>
                      <td className="p-3">{payment.unit_name}</td>
                      <td className="p-3">{payment.payment_type}</td>
                      <td className="p-3 font-semibold text-gray-800">
                        ₱{Number(payment.amount_paid || 0).toFixed(2)}
                      </td>
                      <td
                          className={`p-3 font-medium ${
                              payment.payment_status === "confirmed"
                                  ? "text-green-600"
                                  : "text-red-500"
                          }`}
                      >
                        {payment.payment_status}
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>

              {/* Card view for small screens */}
              <div className="md:hidden space-y-4 mt-4">
                {payments.map((payment) => (
                    <div
                        key={payment.payment_id}
                        className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm"
                    >

                      <div className="flex justify-between mb-2 text-sm">
                        <span className="text-gray-600">Property:</span>
                        <span>{payment.property_name}</span>
                      </div>
                      <div className="flex justify-between mb-2 text-sm">
                        <span className="text-gray-600">Unit:</span>
                        <span>{payment.unit_name}</span>
                      </div>
                      <div className="flex justify-between mb-2 text-sm">
                        <span className="text-gray-600">Type:</span>
                        <span>{payment.payment_type}</span>
                      </div>
                      <div className="flex justify-between mb-2 text-sm">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-semibold text-gray-800">
                  ₱{Number(payment.amount_paid || 0).toFixed(2)}
                </span>
                      </div>

                      {/*<div className="flex justify-between mb-2 text-sm">*/}
                      {/*  <span className="text-gray-600">Date:</span>*/}
                      {/*  <span>{new Date(payment.payment_date).toLocaleDateString()}</span>*/}
                      {/*</div>*/}
                      {/*<div className="flex justify-between text-sm">*/}
                      {/*  <span className="text-gray-600">Receipt Ref:</span>*/}
                      {/*  <span>{payment.receipt_reference || "N/A"}</span>*/}
                      {/*</div>*/}
                    </div>
                ))}
              </div>
            </div>
        )}
      </div>
  );

};

export default PaymentList;
