"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";


export default function EditUnitBill() {
  const router = useRouter();
  const { unit_id } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    reading_date: "",
    water_prev_reading: "",
    water_current_reading: "",
    electricity_prev_reading: "",
    electricity_current_reading: "",
    total_water_amount: "",
    total_electricity_amount: "",
    rent_amount: "",
    association_dues: "",
    late_fee: "",
    penalty_amount: "",
    discount_amount: "",
    total_amount_due: "",
    status: "unpaid",
    due_date: "",
    paid_at: "",
  });

  useEffect(() => {
    if (!unit_id) return;

    const fetchCurrentMonthBill = async () => {
      try {
        const res = await fetch(`/api/landlord/billing/getBillById?unit_id=${unit_id}`);
        const data = await res.json();

        console.log("Fetched bill data:", data);

        if (res.ok) {
          setBill(data);
          setFormData({
            reading_date: data.billing_period ?? "",
            water_prev_reading: data.water_prev_reading ?? "",
            water_current_reading: data.water_current_reading ?? "",
            electricity_prev_reading: data.electricity_prev_reading ?? "",
            electricity_current_reading: data.electricity_current_reading ?? "",
            total_water_amount: data.total_water_amount ?? "",
            total_electricity_amount: data.total_electricity_amount ?? "",
            rent_amount: data.rent_amount ?? "",
            total_amount_due: data.total_amount_due ?? "",

          });
        }
      } catch (error) {
        console.error("Error fetching bill:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentMonthBill();
  }, [unit_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("/api/landlord/billing/updateBill", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billing_id: bill.billing_id, ...formData }),
    });

    if (response.ok) {
      alert("Billing updated successfully!");
      router.push(`/pages/landlord/billing`);
    } else {
      alert("Failed to update billing.");
    }
  };

  if (loading) return <p>Loading...</p>;

  if (!bill) return <p className="text-red-500">No billing record found for this month.</p>;

  return (
      <div className="max-w-xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">
         <p> Bill ID: {bill.billing_id}</p>
          Edit Billing for the Month of {new Date(bill.billing_period).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <label>
            Reading Date:
            <input name="reading_date" value={formData.reading_date} disabled className="w-full border p-2 bg-gray-100" />
          </label>

          <label>
            Water Previous Reading:
            <input
                name="water_prev_reading"
                type="number"
                value={formData.water_prev_reading}
                onChange={handleChange}
                className="w-full border p-2"

            />
          </label>

          <label>
            Water Current Reading:
            <input
                name="water_current_reading"
                type="number"
                value={formData.water_current_reading}
                onChange={handleChange}
                className="w-full border p-2"
            />
          </label>

          <label>
            Total Water Amount:
            <input name="total_water_amount" value={formData.total_water_amount} disabled className="w-full border p-2 bg-gray-100" />
          </label>

          <label>
            Electricity Previous Reading:
            <input
                name="electricity_prev_reading"
                type="number"
                value={formData.electricity_prev_reading}
                onChange={handleChange}
                className="w-full border p-2"

            />
          </label>

          <label>
            Electricity Current Reading:
            <input
                name="electricity_current_reading"
                type="number"
                value={formData.electricity_current_reading}
                onChange={handleChange}
                className="w-full border p-2"
            />
          </label>

          <label>
            Electricity Total Amount:
            <input
                name="total_electricity_amount"
                value={formData.total_electricity_amount}
                onChange={handleChange}
                className="w-full border p-2"
                disabled
            />
          </label>

          <label>
            Total Amount Due:
            <input
                name="total_amount_due"
                type="number"
                value={formData.total_amount_due}
                onChange={handleChange}
                className="w-full border p-2"
                disabled
            />
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

