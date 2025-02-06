'use client'

import useAuth from "../../../../../hooks/useSession";
import Link from "next/link";
import { useRouter} from "next/navigation";


export default function AdminDashboard() {
    const { user, loading, signOut_admin } = useAuth()
    const router = useRouter();
    if (loading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return router.push("./login");
    }

    return (
        <div>
            <h1>
                Welcome, {user.username}!
            </h1>
            <p>Your user type is: {user.role}  | ID: {user.admin_id}</p>
            <hr/>
            <h2 className='m-2'>Side Pan Nav Contents</h2>
            <p className='m-2' ><i>Kindly add these modules links on the sideNav</i></p>
            <div className='mb-10'>
                <Link className='m-2' href='./activiyLog'>ActivityLog</Link>
                <Link className='m-2' href='./co_admin/list'>Add Co-admin</Link>
                <Link className='m-2' href='./tenant_landlord/tenant_mgt'>Tenant Management</Link>
                <Link className='m-2' href='./tenant_landlord/landlord_mgt'>Landlord Management</Link>
                <Link className='m-2' href='./co_admin'>Landlord Verification</Link>
                <Link className='m-2' href='./co_admin'>Property Verification</Link>
                <Link className='m-2' href='./annoucement'>Annoucements</Link>
                <Link className='m-2' href='./bug_report/list'>Bug Reports</Link>
                <Link className='m-2' href='./auditLogs'>Audit Logs</Link>
            </div>
            <button
                onClick={signOut_admin}
                className="bg-red-500 text-white px-4 py-2 rounded-md ml-4"
            >
                Sign Out
            </button>

            {/* Additional content can go here */}
        </div>
    );
}
