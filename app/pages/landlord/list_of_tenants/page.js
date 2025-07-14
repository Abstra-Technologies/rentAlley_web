'use client'


import useAuth from "../../../../hooks/useSession";
import TenantListLandlords from "../../../../components/landlord/listOfCurrentTenants";
import LandlordLayout from "../../../../components/navigation/sidebar-landlord";


export default function LandlordsTenantsListPage() {
    const { user } = useAuth();
    return (
        <LandlordLayout>
        <div className="container mx-auto p-4">
            {/* <h1 className="text-2xl font-bold mb-4">Tenant Management</h1> */}
            <TenantListLandlords landlord_id={user?.landlord_id} />
        </div>
        </LandlordLayout>
    );
}
