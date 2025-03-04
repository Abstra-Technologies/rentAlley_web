"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";
import { FiEye, FiEdit, FiTrash2, FiFileText, FiZap } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

export default function BillsTable() {
  const bills = [
    {
      id: 1,
      name: "Greenview Apartment",
      unit: "Main Building",
      date: "2025-02-22",
      rent: 1200.0,
      electricity: 100.0,
      water: 50.0,
      associationDues: 30.0,
    },
    {
      id: 2,
      name: "Blue Towers",
      unit: "Unit 2A",
      date: "2025-02-22",
      rent: 800.0,
      electricity: 80.0,
      water: 40.0,
      associationDues: 20.0,
    },
  ];

  return (
    <LandlordLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-600">Billing Records</h2>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left text-gray-600 font-semibold">Property</th>
                  <th className="p-4 text-left text-gray-600 font-semibold">Unit</th>
                  <th className="p-4 text-left text-gray-600 font-semibold">Date</th>
                  <th className="p-4 text-right text-gray-600 font-semibold">Rent</th>
                  <th className="p-4 text-right text-gray-600 font-semibold">Electricity</th>
                  <th className="p-4 text-right text-gray-600 font-semibold">Water</th>
                  <th className="p-4 text-right text-gray-600 font-semibold">Assoc. Dues</th>
                  <th className="p-4 text-right text-gray-600 font-semibold">Total</th>
                  <th className="p-4 text-center text-gray-600 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill, index) => (
                  <tr 
                    key={bill.id} 
                    className={`border-t border-gray-200 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="p-4 font-medium text-gray-800">{bill.name}</td>
                    <td className="p-4 text-gray-600">{bill.unit}</td>
                    <td className="p-4 text-gray-600">{bill.date}</td>
                    <td className="p-4 text-right text-gray-800">${bill.rent.toFixed(2)}</td>
                    <td className="p-4 text-right text-gray-600">${bill.electricity.toFixed(2)}</td>
                    <td className="p-4 text-right text-gray-600">${bill.water.toFixed(2)}</td>
                    <td className="p-4 text-right text-gray-600">${bill.associationDues.toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-gray-800">
                      ${(
                        bill.rent +
                        bill.electricity +
                        bill.water +
                        bill.associationDues
                      ).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <DropdownMenu billId={bill.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}

function DropdownMenu({ billId }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleClick = (action) => {
    setOpen(false);
    
    if (action === "view") {
      router.push(`/pages/landlord/billing/view/${billId}`);
    } else if (action === "generateRent") {
      router.push(`/pages/landlord/billing/createRent`);
    } else if (action === "generateUtility") {
      router.push(`/pages/landlord/billing/createUtility`);
    } else if (action === "edit") {
      // Handle edit action
    } else if (action === "delete") {
      // Handle delete action
    }
  };

  return (
    <div className="relative inline-block">
      {/* Three dots button */}
      <button
        className="p-2 text-gray-600 hover:bg-gray-200 rounded-full focus:outline-none transition-colors"
        onClick={() => setOpen(!open)}
      >
        ⋮
      </button>

      {/* Dropdown menu with animation */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 shadow-lg z-50"
            style={{ top: "100%" }}
          >
            <ul className="py-1 rounded-lg overflow-hidden">
              <li
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-gray-700"
                onClick={() => handleClick("view")}
              >
                <FiEye className="text-blue-600" /> View Bill Details
              </li>
              <li
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-gray-700"
                onClick={() => handleClick("generateRent")}
              >
                <FiFileText className="text-green-600" /> Generate Rent Bill
              </li>
              <li
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-gray-700"
                onClick={() => handleClick("generateUtility")}
              >
                <FiZap className="text-yellow-600" /> Generate Utility Bill
              </li>
              <li 
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-gray-700"
                onClick={() => handleClick("edit")}
              >
                <FiEdit className="text-gray-600" /> Edit
              </li>
              <li 
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-red-600"
                onClick={() => handleClick("delete")}
              >
                <FiTrash2 /> Delete
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}