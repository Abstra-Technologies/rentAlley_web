'use client'

import useAuth from "../../../../../hooks/useSession";
import Link from "next/link";


export default function AdminDashboard() {
    const { user, loading, signOut_admin } = useAuth();
    if (loading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return <p>You need to log in to access the dashboard.</p>;
    }

    return (
        <div>
            <h1>
                Welcome, {user.username}!
            </h1>
            <p>Your user type is: {user.role}  | ID: {user.adminID}</p>
            <hr/>
            <h2 className='m-2'>Side Pan Nav Contents</h2>
            <p className='m-2' ><i>Kindly add these modules links on the sideNav</i></p>
            <div className='mb-10'>
                <Link className='m-2' href='./activiyLog'>ActivityLog</Link>
                <Link className='m-2' href='./co_admin/list'>Add Co-admin</Link>
                <Link className='m-2' href='./co_admin'>Tenant Management</Link>
                <Link className='m-2' href='./tenant_landlord/landlord_mgt'>Landlord Management</Link>
                <Link className='m-2' href='./co_admin'>Landlord Verification</Link>
                <Link className='m-2' href='./co_admin'>Property Verification</Link>

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
