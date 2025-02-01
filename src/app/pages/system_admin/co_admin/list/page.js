"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaTrash } from "react-icons/fa";
import useAuth from "../../../../../../hooks/useSession";

export default function CoAdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  // Fetch Co-Admins (Except Logged-in User)
  useEffect(() => {
    if (!user) return; // Don't fetch if user is not authenticated

    const fetchCoAdmins = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/systemadmin/co_admin_list", {
          method: "GET",
          credentials: "include", // Ensures HTTP-only cookies are sent
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to fetch admins");

        setAdmins(data.admins || []); // Default to an empty array if no admins found
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCoAdmins();
  }, [user]);

  // Navigate to create co-admin page
  const handleAddCoAdmin = () => {
    router.push("/pages/system_admin/co_admin/create");
  };

  // Delete a co-admin
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this co-admin?")) return;

    try {
      const res = await fetch(`/api/systemadmin/co_admin/${id}`, {
        method: "DELETE",
        credentials: "include", // Ensures HTTP-only cookies are sent
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete co-admin");

      // Remove the deleted admin from state
      setAdmins((prev) => prev.filter((admin) => admin.adminID !== id));

      alert("Co-admin deleted successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  // Render Loading State
  if (loading) return <p className="text-center text-gray-500">Loading Co-admins...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;
  if (!user) return <p className="text-center text-red-500">You need to log in to access the dashboard.</p>;

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

        {/* Handle No Records */}
        {admins.length === 0 ? (
            <p className="text-center text-gray-500">No record found</p>
        ) : (
            // Co-Admin Table
            <div className="overflow-x-auto border border-gray-300 rounded-lg">
              <table className="table-auto w-full">
                <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
                </thead>
                <tbody>
                {admins.map((admin, index) => (
                    <tr key={admin.adminID} className="border-b border-gray-200">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{admin.adminID}</td>
                      <td className="px-4 py-2">{admin.username}</td>
                      <td className="px-4 py-2">{admin.email}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                            className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                            aria-label="Delete co-admin"
                            onClick={() => handleDelete(admin.adminID)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
  );
}
