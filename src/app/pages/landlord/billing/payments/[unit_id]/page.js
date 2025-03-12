"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";
import Swal from "sweetalert2";

export default function PaymentManagement() {
  const router = useRouter();
  const { unit_id } = useParams();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!unit_id) return;

    async function fetchPayments() {
      try {
        const res = await fetch(
          `/api/landlord/payments/getPayments?unit_id=${unit_id}`
        );
        const data = await res.json();

        console.log(data);
        if (res.ok) {
          setPayments(data);
        } else {
          setError(data.message || "Failed to fetch payments.");
        }
      } catch (err) {
        setError("Error fetching payments.");
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [unit_id]);

  const updatePayment = async (payment_id, status, type) => {
    try {
      const res = await fetch(`/api/landlord/payments/updatePayment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_id,
          payment_status: status,
          payment_type: type,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPayments((prevPayments) =>
          prevPayments.map((p) =>
            p.payment_id === payment_id
              ? { ...p, payment_status: status, payment_type: type }
              : p
          )
        );
      } else {
        Swal.fire({
          icon: "info",
          title: "Notice",
          text: data.message,
        });
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Error updating payment.",
      });
    }
  };

  if (loading) return <p>Loading payments...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (payments.length === 0) return <p>No payments found.</p>;

  return (
    <LandlordLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold mb-4">Payment Management</h1>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Payment Type</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Payment Method</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Proof</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.payment_id} className="hover:bg-gray-100">
                <td className="border p-2">
                  {payment.payment_type
                    .replace("_", " ")
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </td>
                <td className="border p-2">₱{payment.amount_paid}</td>
                <td className="border p-2">{payment.method_name}</td>
                <td className="border p-2">
                  <select
                    value={payment.payment_status}
                    onChange={(e) =>
                      updatePayment(
                        payment.payment_id,
                        e.target.value,
                        payment.payment_type
                      )
                    }
                    className={`border p-1 ${
                      payment.payment_status === "confirmed"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="border p-2">
                  {payment.proof_of_payment ? (
                    <a
                      href={payment.proof_of_payment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      View Proof
                    </a>
                  ) : (
                    "No proof uploaded"
                  )}
                </td>
                <td className="border p-2">
                  <button
                    onClick={() =>
                      updatePayment(
                        payment.payment_id,
                        "confirmed",
                        payment.payment_type
                      )
                    }
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Confirm
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LandlordLayout>
  );
}
