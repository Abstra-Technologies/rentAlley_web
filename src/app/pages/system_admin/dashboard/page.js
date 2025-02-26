'use client'
import useAuth from "../../../../../hooks/useSession";
import Link from "next/link";
import { useRouter} from "next/navigation";
import {useState} from "react";
import PropertyAnalytics from "../../../../components/analytics/PropertyAnalytics";
import LoadingScreen from "../../../../components/loadingScreen";
import SideNavAdmin from "../../../../components/navigation/sidebar-admin";

export default function AdminDashboard() {
    const { signOutAdmin, admin,loading, error } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [notification, setNotification] = useState(null);
    // const { user, admin, loading, logout, error, signout } = useAuthStore();

    const router = useRouter();
    if (loading) {
        return <LoadingScreen />;
    }

    if (!admin) {

    }
    const handleDeleteAccount = async () => {
        const confirmDelete = confirm(
            "⚠️ Warning: Deleting your account is irreversible! \n\n" +
            "• You will permanently lose access to your account. \n" +
            "• All associated data (logs, reports, admin settings) may be deleted. \n" +
            "• This action cannot be undone.\n\n" +
            "Are you sure you want to continue?"
        );

        if (!confirmDelete) return;

        setIsDeleting(true);

        try {
            const response = await fetch("/api/systemadmin/delete_account", {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ admin_id: admin.admin_id }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Failed to delete account.");

            alert("Your account has been successfully deleted.");
            router.push("./login");
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <SideNavAdmin admin={admin} />

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-auto">
                <h1 className="text-2xl font-bold">Welcome, {admin?.username}!</h1>
                <p>Full Name: {admin?.first_name}, {admin?.last_name}</p>
                <p>Your user type is: {admin?.role} | ID: {admin?.admin_id}</p>
                <p>Email: {admin?.email}</p>

                <hr className="my-4" />
                {/* Analytics Section */}
                <h3 className="text-xl font-semibold">Analytics</h3>
                <PropertyAnalytics />
                <div className="mt-4">
                    <iframe 
                        width="100%" 
                        height="600" 
                        src="https://lookerstudio.google.com/embed/reporting/543161d6-3d3e-44ab-b571-ec3446e99257/page/QogyE"
                        style={{ border: "none" }}
                        allowFullScreen
                        sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox">
                    </iframe>
                </div>

                {/* Delete Account Button */}
                <div className="mt-6">
                    <button
                        onClick={handleDeleteAccount}
                        className={`bg-gray-700 text-white px-4 py-2 rounded-md ${isDeleting ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600"}`}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete Account"}
                    </button>
                </div>
            </div>
        </div>
    );
}
