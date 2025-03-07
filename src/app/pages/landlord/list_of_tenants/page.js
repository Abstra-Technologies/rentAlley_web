'use client'


import useAuthStore from "../../../../zustand/authStore";
import useAuth from "../../../../../hooks/useSession";
import TenantListLandlords from "../../../../components/landlord/listOfCurrentTenants";


export default function LandlordsTenantsListPage() {
    const { user } = useAuth();
const landlordId = user?.landlord_id;
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Tenant Management</h1>
            <TenantListLandlords landlord_id={user?.landlord_id} />
        </div>
    );
}
