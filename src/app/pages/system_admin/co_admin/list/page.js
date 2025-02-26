"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaTrash, FaEdit } from "react-icons/fa";
import { MdPersonAddDisabled } from "react-icons/md";
import useAuth from "../../../../../../hooks/useSession";
import EditModal from "../../../../../components/systemAdmin/editAdmin";
import SideNavAdmin from "../../../../../components/navigation/sidebar-admin";
import { logEvent } from "../../../../../utils/gtag";
import LoadingScreen from "../../../../../components/loadingScreen";

export default function CoAdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { admin } = useAuth();
  const [editModal, setEditModal] = useState(false);
  const router = useRouter();
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formData, setFormData] = useState({ username: "", email: "", role: "", status: "", password: "" });

  useEffect(() => {
    if (!admin) return;
    const fetchCoAdmins = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/systemadmin/co_admin_list", { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch admins");
        setAdmins(data.admins || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCoAdmins();
  }, [admin]);

  const handleEdit = async (admin_id) => {
    try {
      const res = await fetch(`/api/systemadmin/co_admin/details/${admin_id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch admin details");
      setSelectedAdmin(admin_id);
      setFormData({ username: data.admin.username, email: data.admin.email, role: data.admin.role, status: data.admin.status, password: "" });
      setEditModal(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (admin_id) => {
    if (!confirm("Are you sure you want to delete this co-admin?")) return;
    try {
      const res = await fetch(`/api/systemadmin/co_admin/${admin_id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete co-admin");
      setAdmins((prev) => prev.filter((admin) => admin.admin_id !== admin_id));
      alert("Co-admin deleted successfully!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (admin_id, newStatus) => {
    try {
      const res = await fetch(`/api/systemadmin/co_admin/status/${admin_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include"
      });
      
      if (!res.ok) throw new Error("Failed to update co-admin status");
      
      setAdmins(prev => prev.map(admin => 
        admin.admin_id === admin_id ? {...admin, status: newStatus} : admin
      ));
      
      alert(`Co-admin status updated to ${newStatus}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddCoAdmin = () => {
    logEvent("page_view", "Navigation", "Add Co-Admin Page", 1); // Track page view in GA
    router.push("/pages/system_admin/co_admin/create");
  };

  if(loading){ return  <LoadingScreen />}

  return (
    <div className="flex h-screen">
      <SideNavAdmin/>
      <div className="flex-1 p-6 bg-gray-100">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">Co-Admin Management</h2>
        <button
            onClick={handleAddCoAdmin}
            className="mb-4 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
        >Add Co-Admin</button>
        {loading ? (
          <p className="text-center text-gray-500">Loading Co-admins...</p>
        ) : error ? (
          <p className="text-center text-red-500">Error: {error}</p>
        ) : (
          <div className="overflow-x-auto border border-gray-300 rounded-lg bg-white p-4 shadow-md">
            <table className="table-auto w-full">
              <thead className="bg-gray-50">
                <tr className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, index) => (
                  <tr key={admin.admin_id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{admin.username}</td>
                    <td className="px-4 py-2">{admin.email}</td>
                    <td className={`px-4 py-2 font-bold ${admin.status === "active" ? "text-green-600" : "text-red-600"}`}>{admin.status}</td>
                    <td className="px-4 py-2 text-center flex space-x-2">
                      <button className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600" onClick={() => handleEdit(admin.admin_id)}>
                        <FaEdit className="inline mr-1"/> Edit
                      </button>
                      <button
                        onClick={() => handleStatusChange(admin.admin_id, admin.status === "active" ? "disabled" : "active")}
                        className={`px-3 py-2 rounded flex items-center ${
                          admin.status === "active" 
                            ? "bg-red-600 text-white hover:bg-red-700" 
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        <MdPersonAddDisabled className="mr-1"/>
                        {admin.status === "active" ? "Disable" : "Enable"}
                      </button>
                      <button className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 flex items-center" onClick={() => handleDelete(admin.admin_id)}>
                        <FaTrash className="mr-1"/> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {editModal && <EditModal formData={formData} handleChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })} handleUpdate={async () => {
          try {
            const res = await fetch(`/api/systemadmin/co_admin/${selectedAdmin}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
              credentials: "include"
            });
            
            if (!res.ok) throw new Error("Failed to update co-admin");
            
            setAdmins(prev => prev.map(admin => 
              admin.admin_id === selectedAdmin 
                ? {...admin, username: formData.username, email: formData.email, role: formData.role, status: formData.status} 
                : admin
            ));
            
            setEditModal(false);
            alert("Co-admin updated successfully!");
          } catch (err) {
            alert(err.message);
          }
        }} closeModal={() => setEditModal(false)} />}
      </div>
    </div>
  );
}