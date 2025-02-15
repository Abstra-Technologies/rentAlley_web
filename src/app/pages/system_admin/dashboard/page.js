'use client'

import useAuth from "../../../../../hooks/useSession";
import Link from "next/link";
import { useRouter} from "next/navigation";
import {useState} from "react";
import PropertyAnalytics from "../../../../components/analytics/PropertyAnalytics";
import { requestFCMPermission, onMessageListener } from "../../../../pages/lib/firebaseConfig";
import useAuthStore from "../../../../pages/zustand/authStore";


export default function AdminDashboard() {
    const { signOutAdmin, admin,loading, error } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [notification, setNotification] = useState(null);
    // const { user, admin, loading, logout, error, signout } = useAuthStore();

    const router = useRouter();
    if (loading) {
        return <p>Loading...</p>;
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
            router.push("./login"); // Redirect to admin_login after account deletion
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div>
            <h1>
                Welcome, {admin?.username}!
            </h1>
            <p>Full Name: {admin?.first_name} , {admin?.last_name}</p>
            <p>Your user type is: {admin?.role} | ID: {admin?.admin_id}</p>
            <p>Email: {admin?.email}</p>
            <hr/>
            <h2 className='m-2'>Side Pan Nav Contents</h2>
            <p className='m-2'><i>Kindly add these modules links on the sideNav</i></p>
            <div className='mb-10'>
                <Link className='m-2' href='./activiyLog'>ActivityLog</Link>
                <Link className='m-2' href='./co_admin/list'>Add Co-admin</Link>
                <Link className='m-2' href='./tenant_landlord/tenant_mgt'>Tenant Management</Link>
                <Link className='m-2' href='./tenant_landlord/landlord_mgt'>Landlord Management</Link>
                {/*<Link className='m-2' href='./co_admin'>Landlord Verification</Link>*/}
                <Link className='m-2' href='./propertyManagement/list'>Property Verification</Link>
                <Link className='m-2' href='./annoucement'>Annoucements</Link>
                <Link className='m-2' href='./bug_report/list'>Bug Reports</Link>
                <Link className='m-2' href='./auditLogs'>Audit Logs</Link>

                <h3>Analytics</h3>
                <PropertyAnalytics />
            </div>
            {/* Buttons */}
            <div className="flex space-x-4">
                <button
                    onClick={signOutAdmin}
                    className="bg-red-500 text-white px-4 py-2 rounded-md"
                >
                    Sign Out
                </button>

                <button
                    onClick={handleDeleteAccount}
                    className={`bg-gray-700 text-white px-4 py-2 rounded-md ${isDeleting ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600"}`}
                    disabled={isDeleting}
                >
                    {isDeleting ? "Deleting..." : "Delete Account"}
                </button>
            </div>

            {/* Additional content can go here */}
        </div>
    );
}
