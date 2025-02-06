"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaTrash } from "react-icons/fa";
import EditAnnoucementModal from "../../../../../components/systemAdmin/editAnnoucement";

export default function AnnouncementsList() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [formData, setFormData] = useState({ title: "", message: "", target_audience: "" });
    const [editModal, setEditModal] = useState(false);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch("/api/systemadmin/annoucement/view", {
                    method: "GET",
                    credentials: "include",
                });

                if (res.status === 401) {
                    alert("Session expired. Please log in again.");
                    router.push("/pages/system_admin/login");
                    return;
                }

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Failed to fetch announcements");

                setAnnouncements(data.announcements || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this announcement?")) return;

        try {
            const res = await fetch(`/api/systemadmin/annoucement/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete announcement");

            // Remove from state
            setAnnouncements((prev) => prev.filter((announcement) => announcement.id !== id));
            alert("Announcement deleted successfully!");
        } catch (error) {
            alert(error.message);
        }
    };

    const handleEdit = async (id) => {
        try {
            const res = await fetch(`/api/systemadmin/annoucement/details/${id}`);
            const data = await res.json();
            if (!res.ok) new Error(data.message || "Failed to fetch announcement details");

            setSelectedAnnouncement(id);
            setFormData({
                title: data.announcement.title || "",
                message: data.announcement.message || "",
                target_audience: data.announcement.target_audience,
            });

            setEditModal(true);
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log(`Changing ${name} to:`, value); // ✅ Debugging log
        setFormData((prev) => ({
            ...prev,
            [name]: value, // ✅ Ensure it updates target_audience
        }));
    };

    const handleUpdateAnnouncement = async () => {
        try {
            const res = await fetch(`/api/systemadmin/annoucement/details/${selectedAnnouncement}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title,
                    message: formData.message,
                    target_audience: formData.target_audience,
                }),
            });

            const data = await res.json();
            if (!res.ok)  new Error(data.message || "Failed to update announcement");

            // Update announcement in state
            setAnnouncements((prev) =>
                prev.map((announcement) =>
                    announcement.id === selectedAnnouncement
                        ? { ...announcement, ...formData }
                        : announcement
                )
            );

            alert("Announcement updated successfully!");
            setEditModal(false);
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <p className="text-center text-gray-500">Loading announcements...</p>;
    if (error) return <p className="text-center text-red-500">Error: {error}</p>;

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">View Other Admin Announcements</h2>

            {announcements.length === 0 ? (
                <p className="text-center text-gray-500">No announcements found</p>
            ) : (
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                    <table className="table-auto w-full">
                        <thead>
                        <tr className="border-b border-gray-300">
                            <th className="px-4 py-2">#</th>
                            <th className="px-4 py-2">Title</th>
                            <th className="px-4 py-2">Message</th>
                            <th className="px-4 py-2">Audience</th>
                            <th className="px-4 py-2">Posted By</th>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {announcements.map((announcement, index) => (
                            <tr key={announcement.id} className="border-b border-gray-200">
                                <td className="px-4 py-2">{index + 1}</td>
                                <td className="px-4 py-2 font-semibold">{announcement.title}</td>
                                <td className="px-4 py-2">{announcement.message}</td>
                                <td className="px-4 py-2">{announcement.target_audience}</td>
                                <td className="px-4 py-2">{announcement.admin_name}</td>
                                <td className="px-4 py-2">{new Date(announcement.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 m-1"
                                        aria-label="Delete announcement"
                                        onClick={() => handleDelete(announcement.id)}
                                    >
                                        <FaTrash />
                                    </button>
                                    <button
                                        className="bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600"
                                        onClick={() => handleEdit(announcement.id)}
                                    >
                                        <FaEdit /> Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
            {editModal && (
                <EditAnnoucementModal
                    formData={formData}
                    handleChange={handleChange}
                    handleUpdate={handleUpdateAnnouncement}
                    closeModal={() => setEditModal(false)}
                />
            )}
        </div>
    );
}
