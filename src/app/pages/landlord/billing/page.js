"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";

export default function BillsTable() {
  const bills = [
    {
      id: 1,
      type: "Property",
      name: "Greenview Apartment",
      date: "2025-02-22",
      rent: 1200.0,
      electricity: 100.0,
      water: 50.0,
      associationDues: 30.0,
    },
    {
      id: 2,
      type: "Unit",
      name: "Unit 2A - Blue Towers",
      date: "2025-02-22",
      rent: 800.0,
      electricity: 80.0,
      water: 40.0,
      associationDues: 20.0,
    },
  ];

  return (
    <LandlordLayout>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Billing Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-lg rounded-lg">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Rent</th>
                <th className="p-3 text-left">Electricity</th>
                <th className="p-3 text-left">Water</th>
                <th className="p-3 text-left">Association Dues</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b hover:bg-gray-100">
                  <td className="p-3">{bill.type}</td>
                  <td className="p-3">{bill.name}</td>
                  <td className="p-3">{bill.date}</td>
                  <td className="p-3">${bill.rent.toFixed(2)}</td>
                  <td className="p-3">${bill.electricity.toFixed(2)}</td>
                  <td className="p-3">${bill.water.toFixed(2)}</td>
                  <td className="p-3">${bill.associationDues.toFixed(2)}</td>
                  <td className="p-3 font-semibold">
                    $
                    {(
                      bill.rent +
                      bill.electricity +
                      bill.water +
                      bill.associationDues
                    ).toFixed(2)}
                  </td>
                  <td className="p-3 text-center relative">
                    <DropdownMenu billId={bill.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LandlordLayout>
  );
}

function DropdownMenu({ billId }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative inline-block">
      {/* Three dots button */}
      <button
        className="p-2 text-gray-600 hover:bg-gray-300 rounded-md focus:outline-none text-2xl"
        onClick={() => setOpen(!open)}
      >
        ⋮
      </button>

      {/* Dropdown menu (visible when `open` is true) */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50"
          style={{ top: "100%" }} // Ensures it appears in front
        >
          <ul className="py-1">
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => router.push(`/pages/landlord/billing/createRent`)}
            >
              Generate Rent Bill
            </li>
            <li
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() =>
                router.push(`/pages/landlord/billing/createUtility`)
              }
            >
              Generate Utility Bill
            </li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Edit</li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600">
              Delete
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
