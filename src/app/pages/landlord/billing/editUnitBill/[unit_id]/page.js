"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditUnitBill() {
  const router = useRouter();
  const { unit_id } = useParams();
  const [step, setStep] = useState(1);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [propertyRates, setPropertyRates] = useState({
    waterRate: 0,
    electricityRate: 0,
  });
  const [formData, setFormData] = useState({
    water_prev_reading: "",
    water_current_reading: "",
    electricity_prev_reading: "",
    electricity_current_reading: "",
    penalty_amount: "",
    discount_amount: "",
    rent_amount: "",
    assoc_dues: "",
    late_fee: "",
    total_water_amount: "",
    total_electricity_amount: "",
    total_amount_due: "",
  });

  useEffect(() => {
    if (!unit_id) return;

    const fetchCurrentMonthBill = async () => {
      try {
        const res = await fetch(`/api/landlord/billing/getBillById?unit_id=${unit_id}`);
        const data = await res.json();

        if (res.ok) {
          setBill(data);
          setFormData({
            water_prev_reading: data.water_prev_reading ?? "",
            water_current_reading: data.water_current_reading ?? "",
            electricity_prev_reading: data.electricity_prev_reading ?? "",
            electricity_current_reading: data.electricity_current_reading ?? "",
            penalty_amount: data.penalty_amount ?? "",
            discount_amount: data.discount_amount ?? "",
            rent_amount: data.rent_amount ?? "",
            assoc_dues: data.assoc_dues ?? "",
            late_fee: data.late_fee ?? "",
            total_water_amount: data.total_water_amount ?? "",
            total_electricity_amount: data.total_electricity_amount ?? "",
            total_amount_due: data.total_amount_due ?? "",
          });
        }
      } catch (error) {
        console.error("Error fetching bill:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchConcessionaireData = async () => {
      try {
        const res = await fetch(`/api/landlord/billing/getConcessionaireRates?unit_id=${unit_id}`);
        const concessionaireData = await res.json();

        if (res.ok) {
          setPropertyRates({
            waterRate: concessionaireData.water_rate || 0,
            electricityRate: concessionaireData.electricity_rate || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching concessionaire data:", error);
      }
    };

    fetchCurrentMonthBill();
    fetchConcessionaireData();
  }, [unit_id]);

  // Auto calculate bill
  const calculateBill = () => {
    const waterUsage = Math.max(0, parseFloat(formData.water_current_reading) - parseFloat(formData.water_prev_reading));
    const electricityUsage = Math.max(0, parseFloat(formData.electricity_current_reading) - parseFloat(formData.electricity_prev_reading));

    const totalWaterAmount = (waterUsage * propertyRates.waterRate).toFixed(2);
    const totalElectricityAmount = (electricityUsage * propertyRates.electricityRate).toFixed(2);

    const totalAmountDue = (
        parseFloat(totalWaterAmount) +
        parseFloat(totalElectricityAmount) +
        parseFloat(formData.rent_amount) +
        parseFloat(formData.assoc_dues) +
        parseFloat(formData.late_fee) +
        parseFloat(formData.penalty_amount) || 0 -
        parseFloat(formData.discount_amount) || 0
    ).toFixed(2);

    setFormData((prevForm) => ({
      ...prevForm,
      total_water_amount: totalWaterAmount,
      total_electricity_amount: totalElectricityAmount,
      total_amount_due: totalAmountDue,
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    const updatedForm = { ...formData, [e.target.name]: e.target.value };
    calculateBill(updatedForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
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
    } catch (error) {
      console.error("Error updating bill:", error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!bill) return <p className="text-red-500">No billing record found for this month.</p>;

  return (
      <div className="max-w-xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">
          Edit Billing for {new Date(bill.billing_period).toLocaleDateString("en-US", { year: "numeric", month: "long" })}
        </h2>

        {step === 1 && (
            <>
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold">Concessionaire Rates</h3>
                <p> Water Rate: <strong>₱{propertyRates.waterRate} per m³</strong></p>
                <p>Electricity Rate: <strong>₱{propertyRates.electricityRate} per kWh</strong></p>
              </div>

              <form className="space-y-4">
                <label>Water Previous Reading:
                  <input name="water_prev_reading" type="number" value={formData.water_prev_reading} onChange={handleChange} className="w-full border p-2"/>
                </label>

                <label>Water Current Reading:
                  <input name="water_current_reading" type="number" value={formData.water_current_reading} onChange={handleChange} className="w-full border p-2"/>
                </label>

                <label>Electricity Previous Reading:
                  <input name="electricity_prev_reading" type="number" value={formData.electricity_prev_reading} onChange={handleChange} className="w-full border p-2"/>
                </label>

                <label>Electricity Current Reading:
                  <input name="electricity_current_reading" type="number" value={formData.electricity_current_reading} onChange={handleChange} className="w-full border p-2"/>
                </label>
                <label>
                  Rent Amount:
                  <input name="rent_amount" value={formData.rent_amount} disabled className="w-full border p-2 bg-gray-100"/>
                </label>
                <label>
                  Association Dues:
                  <input name="assoc_dues" value={formData.assoc_dues} disabled className="w-full border p-2 bg-gray-100"/>
                </label>

                <label>
                  Late Fee:
                  <input name="late_fee" value={formData.late_fee} disabled className="w-full border p-2 bg-gray-100"/>
                </label>
                <label>
                  Penalties:
                  <input name="penalty_amount" type="number" value={formData.penalty_amount} onChange={handleChange} className="w-full border p-2"/>
                </label>

                <label>
                  Discounts:
                  <input name="discount_amount" type="number" value={formData.discount_amount} onChange={handleChange} className="w-full border p-2"/>
                </label>
                <button onClick={() => { calculateBill(); setStep(2); }} type="button" className="bg-blue-500 text-white px-4 py-2 rounded">
                  Next
                </button>

              </form>
            </>
        )}

        {step === 2 && (
            <>
              <h3 className="text-xl font-semibold mt-4">Billing Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg shadow-md mt-4">
                <p>Water Usage Cost: <strong>₱{formData.total_water_amount}</strong></p>
                <p>Electricity Usage Cost: <strong>₱{formData.total_electricity_amount}</strong></p>
                <p>Rent Amount: <strong>₱{formData.rent_amount}</strong></p>
                <p>Penalties: <strong>₱{formData.penalty_amount}</strong></p>

                <p>Association Dues: <strong>₱{formData.assoc_dues}</strong></p>
                <p className="text-lg font-bold mt-2">Total Amount Due: <strong>₱{formData.total_amount_due}</strong></p>
              </div>

              <div className="mt-4 flex justify-between">
                <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-400 text-white rounded">
                  Previous
                </button>
                <button onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded">
                  Update Bill
                </button>
              </div>
            </>
        )}
      </div>
  );
}
