"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditUnitBill() {
  const router = useRouter();
  const { billing_id } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    total_water_amount: "",
    total_electricity_amount: "",
    penalty_amount: "",
    discount_amount: "",
    total_amount_due: "",
    status: "unpaid",
    due_date: "",
    paid_at: "",
  });

  useEffect(() => {
    if (billing_id) {
      fetch(`/api/landlord/billing/getBillById?billing_id=${billing_id}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Fetched bill data:", data);

          if (Array.isArray(data) && data.length > 0) {
            const billData = data[0];

            setBill(billData);
            setFormData({
              total_water_amount: billData.total_water_amount ?? "",
              total_electricity_amount: billData.total_electricity_amount ?? "",
              penalty_amount: billData.penalty_amount ?? "",
              discount_amount: billData.discount_amount ?? "",
              total_amount_due: billData.total_amount_due ?? "",
              status: billData.status ?? "unpaid",
              due_date: billData.due_date ?? "",
              paid_at: billData.paid_at ?? "",
            });
          }

          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching bill:", error);
          setLoading(false);
        });
    }
  }, [billing_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("/api/landlord/billing/updateBill", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billing_id, ...formData }),
    });

    if (response.ok) {
      alert("Billing updated successfully!");
      router.push(`/pages/landlord/billing`);
    } else {
      alert("Failed to update billing.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Edit Billing</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label>
          Total Water Bill:
          <input
            name="total_water_amount"
            type="number"
            value={formData.total_water_amount}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </label>

        <label>
          Total Electricity Bill:
          <input
            name="total_electricity_amount"
            type="number"
            value={formData.total_electricity_amount}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </label>

        <label>
          Penalty:
          <input
            name="penalty_amount"
            type="number"
            value={formData.penalty_amount}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </label>

        <label>
          Discount:
          <input
            name="discount_amount"
            type="number"
            value={formData.discount_amount}
            onChange={handleChange}
            className="w-full border p-2"
          />
        </label>

        <label>
          Payment Status:
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border p-2"
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </label>

        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Update
        </button>
      </form>
    </div>
  );
}
