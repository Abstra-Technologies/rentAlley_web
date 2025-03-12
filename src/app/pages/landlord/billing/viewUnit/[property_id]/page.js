"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import LandlordLayout from "../../../../../../components/navigation/sidebar-landlord";
import LoadingScreen from "../../../../../../components/loadingScreen";
import Swal from "sweetalert2";

export default function ViewUnits() {
  const { property_id } = useParams();

  const [units, setUnits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [billingData, setBillingData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasBillingForMonth, setHasBillingForMonth] = useState(false);

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
        setLoading(true);

        const res = await axios.get(`/api/landlord/billing/getUnitDetails`, {
          params: { property_id },
          headers: { "Cache-Control": "no-cache" },
        });

        console.log("Fetched units:", res.data);

        const unitBillingPromises = res.data.map(async (unit) => {
          try {
            const billingRes = await axios.get(
              `/api/landlord/billing/getUnitBillingStatus`,
              {
                params: { unit_id: unit.unit_id },
              }
            );

            return {
              ...unit,
              hasBillForThisMonth: billingRes.data.hasBillForThisMonth,
            };
          } catch (error) {
            console.error(
              `Error fetching billing for unit ${unit.unit_id}:`,
              error
            );
            return { ...unit, hasBillForThisMonth: false };
          }
        });

        const unitsWithBillingStatus = await Promise.all(unitBillingPromises);

        setUnits(unitsWithBillingStatus);
      } catch (error) {
        console.error(
          "Failed to fetch units:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    }

    async function fetchBillingData() {
      try {
        const response = await axios.get(
          `/api/landlord/billing/checkBillingStatus`,
          {
            params: { property_id },
          }
        );

        if (response.data.billingData && response.data.billingData.length > 0) {
          setBillingData(response.data.billingData);
          setHasBillingForMonth(true);
          setBillingForm({
            billingPeriod: response.data.billingData[0]?.billing_period || "",
            electricityTotal:
              response.data.billingData.find(
                (b) => b.utility_type === "electricity"
              )?.total_billed_amount || "",
            electricityRate:
              response.data.billingData.find(
                (b) => b.utility_type === "electricity"
              )?.rate_consumed || "",
            waterTotal:
              response.data.billingData.find((b) => b.utility_type === "water")
                ?.total_billed_amount || "",
            waterRate:
              response.data.billingData.find((b) => b.utility_type === "water")
                ?.rate_consumed || "",
          });
        } else {
          setBillingData(null);
          setHasBillingForMonth(false);
        }
      } catch (error) {
        console.error(
          "Failed to fetch billing data:",
          error.response?.data || error.message
        );
      }
    }
    fetchBillingData();
    fetchData();
  }, [property_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBillingForm({ ...billingForm, [name]: value });
  };

  const handleSaveOrUpdateBilling = async (e) => {
    e.preventDefault();
    try {
      const url = hasBillingForMonth
        ? "/api/landlord/billing/updateConcessionaireBilling"
        : "/api/landlord/billing/saveConcessionaireBilling";

      const response = await axios({
        method: hasBillingForMonth ? "PUT" : "POST",
        url: url,
        data: {
          property_id,
          ...billingForm,
        },
      });

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: hasBillingForMonth
          ? "Billing information updated successfully."
          : "Billing information saved successfully.",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });

      setIsEditing(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error(
        "Error saving billing:",
        error.response?.data || error.message
      );
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Failed to save billing. Please try again.",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <LandlordLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Units in Property {property_id}
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-blue-700 transition"
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
                className="bg-white p-6 border rounded-lg shadow-lg"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {unit.unit_name}
                </h2>
                <p className="text-gray-600">Size: {unit.unit_size} sqm</p>
                <p className="text-gray-600">Rent: ₱{unit.rent_amount}</p>

                {/* Billing Status */}
                {unit.hasBillForThisMonth ? (
                  <p className="text-green-600 font-semibold mt-2">
                    ✅ Bill Generated for this month
                  </p>
                ) : (
                  <p className="text-red-600 font-semibold mt-2">
                    ❌ No Bill for this month
                  </p>
                )}

                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    href={`/pages/landlord/billing/billingHistory/${unit.unit_id}`}
                  >
                    <button className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 transition">
                      Billing History
                    </button>
                  </Link>

                  <Link
                    href={`/pages/landlord/billing/payments/${unit.unit_id}`}
                  >
                    <button className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-600 transition">
                      View Payments
                    </button>
                  </Link>
                  {unit.hasBillForThisMonth ? (
                    <Link
                      href={`/pages/landlord/billing/editUnitBill/${unit.unit_id}`}
                    >
                      <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-yellow-700 transition">
                        Edit Unit Bill
                      </button>
                    </Link>
                  ) : (
                    <Link
                      href={`/pages/landlord/billing/createUnitBill/${unit.unit_id}`}
                    >
                      <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition">
                        Create Unit Bill
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center col-span-full">
              No units found.
            </p>
          )}
        </div>

        {/* For Concessionaire Billing */}

        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-screen overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Property Utility
              </h2>
              {billingData ? (
                <div className="text-green-600 font-semibold mb-4">
                  <p>Billing already set for this month</p>
                  <p>Billing Period: {billingForm?.billingPeriod} </p>
                  <div className="mt-2">
                    <h3 className="text-lg font-semibold text-gray-800">Electricity</h3>
                    <p>Total Billed: <span className="text-gray-700">₱{billingData.find(b => b.utility_type === "electricity")?.total_billed_amount || "N/A"}</span></p>
                    <p>Rate per Unit: <span className="text-gray-700">{billingData.find(b => b.utility_type === "electricity")?.rate_consumed || "N/A"} kWh</span></p>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-800">Water</h3>
                    <p>Total Billed: <span className="text-gray-700">₱{billingData.find(b => b.utility_type === "water")?.total_billed_amount || "N/A"}</span></p>
                    <p>Rate per Unit: <span className="text-gray-700">{billingData.find(b => b.utility_type === "water")?.rate_consumed || "N/A"} cu. meters</span></p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  No billing data found for this month.
                </p>
              )}

              <form className="space-y-4" onSubmit={handleSaveOrUpdateBilling}>
                <div>
                  <label className="block text-gray-700 font-medium">
                    Billing Period (Date)
                  </label>
                  <input
                    name="billingPeriod"
                    value={billingForm.billingPeriod}
                    onChange={handleInputChange}
                    type='date'
                    className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                  />
                </div>

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
                      Rate this month
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
                      Rate this month
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

                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-400 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    {isEditing ? "Edit Utility Info" : "Save Utility Info"}
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
