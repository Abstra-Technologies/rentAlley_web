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
        const response = await fetch(`/api/landlord/payments/${landlord_id}`);
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

  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="bg-white p-4 shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Payments Received</h2>
      {payments.length === 0 ? (
        <p>No payments found.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Payment ID</th>
              <th className="border p-2">Property</th>
              <th className="border p-2">Unit</th>
              <th className="border p-2">Type</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Date</th>
              <th className="border p-2">Receipt Ref</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.payment_id} className="border">
                <td className="border p-2">{payment.payment_id}</td>
                <td className="border p-2">{payment.property_name}</td>
                <td className="border p-2">{payment.unit_name}</td>
                <td className="border p-2">{payment.payment_type}</td>
                <td className="border p-2">
                  ₱{payment.amount_paid.toFixed(2)}
                </td>
                <td
                  className={`border p-2 ${
                    payment.payment_status === "confirmed"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {payment.payment_status}
                </td>
                <td className="border p-2">
                  {new Date(payment.payment_date).toLocaleDateString()}
                </td>
                <td className="border p-2">
                  {payment.receipt_reference || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PaymentList;
