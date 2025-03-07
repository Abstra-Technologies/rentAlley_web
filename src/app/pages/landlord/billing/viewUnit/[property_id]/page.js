"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";

export default function ViewUnits() {
  const { property_id } = useParams();

  const [units, setUnits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [billingForm, setBillingForm] = useState({
    billingPeriod: "",
    electricityTotal: "",
    electricityRate: "",
    waterTotal: "",
    waterRate: "",
  });

  useEffect(() => {
    if (!property_id) return;

    async function fetchData() {
      try {
        const res = await axios.get(`/api/landlord/billing/getUnitDetails`, {
          params: { property_id },
        });

        console.log("Fetched units:", res.data);

        setUnits(res.data);
      } catch (error) {
        console.error(
          "Failed to fetch units:",
          error.response?.data || error.message
        );
      }
    }

    fetchData();
  }, [property_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingForm({ ...billingForm, [name]: value });
  };

  return (
    <LandlordLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Units in Property {property_id}
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            Property Utility
          </button>
        </div>

        {/* Unit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.length > 0 ? (
            units.map((unit) => (
              <div
                key={unit.unit_id}
                className="bg-white p-4 border rounded-lg shadow-md"
              >
                <h2 className="text-lg font-semibold text-gray-800">
                  {unit.unit_name}
                </h2>
                <p className="text-gray-600">Size: {unit.unit_size} sqm</p>
                <p className="text-gray-600">Rent: ₱{unit.rent_amount}</p>
                <div className="mt-4 flex justify-between">
                  <Link
                    href={`/pages/landlord/billingHistory/${unit.unit_id}`}
                    className="w-full text-center"
                  >
                    <button className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 transition">
                      Billing History
                    </button>
                  </Link>
                  <Link
                    href={`/pages/landlord/billing/createUnitBill/${unit.unit_id}`}
                    className="w-full text-center"
                  >
                    <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition">
                      Create Unit Bill
                    </button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No units found.</p>
          )}
        </div>

        {/* For Concessionaire Billing */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-screen overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Property Utility
              </h2>
              <form className="space-y-4">
                {/* Billing Period */}
                <div>
                  <label className="block text-gray-700 font-medium">
                    Billing Period (Date)
                  </label>
                  <input
                    type="date"
                    name="billingPeriod"
                    value={billingForm.billingPeriod}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                  />
                </div>

                {/* Electricity Section */}
                <div className="p-4 border rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Electricity
                  </h3>
                  <div className="mt-2">
                    <label className="block text-gray-700 font-medium">
                      Total Amount Billed
                    </label>
                    <input
                      type="number"
                      name="electricityTotal"
                      value={billingForm.electricityTotal}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-gray-700 font-medium">
                      Rate per Unit
                    </label>
                    <input
                      type="number"
                      name="electricityRate"
                      value={billingForm.electricityRate}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                    />
                  </div>
                </div>

                {/* Water Section */}
                <div className="p-4 border rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-700">Water</h3>
                  <div className="mt-2">
                    <label className="block text-gray-700 font-medium">
                      Total Amount Billed
                    </label>
                    <input
                      type="number"
                      name="waterTotal"
                      value={billingForm.waterTotal}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-gray-700 font-medium">
                      Rate per Unit
                    </label>
                    <input
                      type="number"
                      name="waterRate"
                      value={billingForm.waterRate}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-400 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
                  >
                    Save Utility Info
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LandlordLayout>
  );
}
