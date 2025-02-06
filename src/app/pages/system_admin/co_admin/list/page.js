"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaTrash } from "react-icons/fa";
import useAuth from "../../../../../../hooks/useSession";
import { MdPersonAddDisabled } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import EditModal from "../../../../../components/systemAdmin/editAdmin";


export default function CoAdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [editModal, setEditModal] = useState(false);
  const [logs, setLogs] = useState([]); // Store logs for the selected admin
  const router = useRouter();
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", role: "", status: "", password: "" });
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

  const handleEdit = async (admin_id) => {
    try {
      const res = await fetch(`/api/systemadmin/co_admin/details/${admin_id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch admin details");

      setSelectedAdmin(admin_id);
      setFormData({
        username: data.admin.username,
        email: data.admin.email,
        role: data.admin.role,
        status: data.admin.status,
        password: ""
      });
      setEditModal(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateAdmin = async () => {
    try {
      const res = await fetch(`/api/systemadmin/co_admin/details/${selectedAdmin}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          password: formData.password ? formData.password : undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update admin");

      setAdmins((prev) =>
          prev.map((admin) =>
              admin.admin_id === selectedAdmin
                  ? { ...admin, username: formData.username, email: formData.email, role: formData.role, status: formData.status }
                  : admin
          )
      );

      alert("Co-admin updated successfully!");
      setEditModal(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Delete a co-admin
  const handleDelete = async (admin_id) => {
    if (!confirm("Are you sure you want to delete this co-admin?")) return;

    try {
      const res = await fetch(`/api/systemadmin/co_admin/${admin_id}`, {
        method: "DELETE",
        credentials: "include", // Ensures HTTP-only cookies are sent
      });

      const data = await res.json();
      if (!res.ok)  new Error(data.message || "Failed to delete co-admin");
      // Remove the deleted admin from state
      setAdmins((prev) => prev.filter((admin) => admin.admin_id !== admin_id));

      alert("Co-admin deleted successfully!");
    } catch (err) {
      alert(err.message);
    }
  };


  const viewActivityLogs = async (admin_id, name) => {
    setSelectedAdmin(name);
    setShowModal(true);
    setLogs([]); // Clear previous logs

    try {
      const res = await fetch(`/api/systemadmin/co_admin/logs/${admin_id}`);
      const data = await res.json();
      if (!res.ok)  new Error(data.message || "Failed to fetch activity logs");

      setLogs(data.logs || []); // ✅ Ensure logs is always an array
    } catch (err) {
      console.error("Error fetching logs:", err.message);
      setLogs([{ action: "No logs available", timestamp: "" }]);
    }
  };


// this is to handle if the super admin wants to disable other admin accounts
  const handleStatusChange = async (admin_id, newStatus) => {
    if (!confirm(`Are you sure you want to ${newStatus === "disabled" ? "disable" : "re-enable"} this co-admin?`)) return;

    try {
      const res = await fetch(`/api/systemadmin/co_admin/${admin_id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Failed to ${newStatus} co-admin`);

      // Fetch the updated list from the database
      const updatedRes = await fetch("/api/systemadmin/co_admin_list");
      const updatedData = await updatedRes.json();
      if (!updatedRes.ok) throw new Error(updatedData.message || "Failed to refresh admin list");

      setAdmins(updatedData.admins); // Update the state with new data

      alert(`Co-admin ${newStatus} successfully!`);
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
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
                </thead>
                <tbody>
                {admins.map((admin, index) => (
                    <tr key={admin.admin_id} className="border-b border-gray-200">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{admin.admin_id}</td>
                      <td className="px-4 py-2 text-blue-600 cursor-pointer hover:underline"
                          onClick={() => viewActivityLogs(admin.admin_id, admin.username)}>
                        {admin.username}
                      </td>
                      <td className="px-4 py-2">{admin.email}</td>
                      <td className="px-4 py-2">{admin.status}</td>

                      <td className="px-4 py-2 text-center">
                        <button
                            className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 m-1"
                            aria-label="Delete co-admin"
                            onClick={() => handleDelete(admin.admin_id)}
                        >
                          <FaTrash/>
                        </button>
                        <button className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
                                onClick={() => handleEdit(admin.admin_id)}>
                          <FaEdit/> Edit
                        </button>
                        {admin.status === "active" ? (
                            <button
                                onClick={() => handleStatusChange(admin.admin_id, "disabled")}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              {/*<MdPersonAddDisabled/>*/}
                              Disable
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStatusChange(admin.admin_id, "active")}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Re-enable
                            </button>
                        )}
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}

        {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
              <div className="bg-white p-6 rounded shadow-md w-1/3 relative">
                <h2 className="text-xl font-semibold mb-4">{selectedAdmin}'s Activity Logs</h2>

                {/* Close Button */}
                <button
                    className="absolute top-2 right-4 text-xl font-bold cursor-pointer"
                    onClick={() => {
                      setShowModal(false); // Close the modal
                      setSelectedAdmin(null); // Clear selected admin
                      setLogs([]); // Clear logs when closing
                    }}
                >
                  &times;
                </button>

                {/* Activity Log List */}
                <ul className="max-h-60 overflow-y-auto">
                  {logs.length > 0 ? (
                      logs.map((log, index) => (
                          <li key={index} className="border-b p-2">
                            <p className="text-sm">{log.action}</p>
                            <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                          </li>
                      ))
                  ) : (
                      <p className="text-gray-500">No logs available</p>
                  )}
                </ul>

                {/* Close Modal Button */}
                <div className="mt-4 flex justify-end">
                  <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedAdmin(null);
                        setLogs([]);
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
        )}
        {editModal && <EditModal formData={formData} handleChange={handleChange} handleUpdate={handleUpdateAdmin} closeModal={() => setEditModal(false)} />}
      </div>
  );
}



