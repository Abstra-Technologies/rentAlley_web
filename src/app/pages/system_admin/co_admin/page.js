"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation"; // For navigation to the create co-admin page
import { FaTrash } from "react-icons/fa"; // Trash icon from react-icons

const CoAdminDashboard = () => {
  const [coAdmins, setCoAdmins] = useState([]);
  const router = useRouter();

  // Dummy data for testing UI
  useEffect(() => {
    setCoAdmins([
      {
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        dateCreated: "2025-01-25",
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane.smith@example.com",
        dateCreated: "2025-01-26",
      },
    ]);
  }, []);

  // Fetch co-admin data from the API
  const fetchCoAdmins = async () => {
    // GPT GENERATED
    //
    // try {
    //   const response = await axios.get("/api/co-admins");
    //   setCoAdmins(response.data);
    // } catch (error) {
    //   console.error("Error fetching co-admins", error);
    // }
  };

  // Delete a co-admin
  const handleDelete = async (id) => {
    // GPT GENERATED
    //
    // try {
    //   await axios.delete(`/api/co-admins/${id}`);
    //   setCoAdmins(coAdmins.filter((coAdmin) => coAdmin.id !== id));
    // } catch (error) {
    //   console.error("Error deleting co-admin", error);
    // }
  };

  // Navigate to the create co-admin page
  const handleAddCoAdmin = () => {
    router.push("/pages/system_admin/co_admin/create"); // Navigate to the create co-admin page
  };

  useEffect(() => {
    fetchCoAdmins();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Co-Admin List</h2>

      {/* Add Co-Admin Button */}
      <button
        onClick={handleAddCoAdmin}
        className="mb-4 bg-blue-600 text-white font-bold px-5 py-2 rounded hover:bg-blue-700"
      >
        Add Co-Admin
      </button>

      {/* Co-Admin Table */}
      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="table-auto w-full">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Date Created</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coAdmins.map((coAdmin) => (
              <tr key={coAdmin.id} className="border-b border-gray-300">
                <td className="px-4 py-2">{coAdmin.name}</td>
                <td className="px-4 py-2">{coAdmin.email}</td>
                <td className="px-4 py-2">{coAdmin.dateCreated}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                    aria-label="delete button"
                    onClick={() => handleDelete(coAdmin.id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoAdminDashboard;
