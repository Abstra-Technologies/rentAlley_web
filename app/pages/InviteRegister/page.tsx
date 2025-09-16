'use client';

import useAuthStore from '@/zustand/authStore';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';

 function TenantInviteJoinPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const inviteCode = searchParams.get('invite');

    const { user, admin, loading, fetchSession } = useAuthStore();

    const [inviteDetails, setInviteDetails] = useState<any>(null);
    const [expired, setExpired] = useState(false);
    const [loadingInvite, setLoadingInvite] = useState(true);

    // useEffect(() => {
    //     // Always fetch session first
    //     fetchSession().then(() => {
    //         if (!loading && !user) {
    //             const currentPath = window.location.pathname;
    //             router.push(`/pages/auth/login?redirect=${encodeURIComponent(currentPath)}`);
    //         }
    //     });
    // }, [user, loading, fetchSession, router]);


    useEffect(() => {
        async function fetchInviteDetails() {
            try {
                const res = await fetch(`/api/invite/${inviteCode}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setInviteDetails(data.invite);
            } catch {
                setExpired(true);
            } finally {
                setLoadingInvite(false);
            }
        }

        if (inviteCode) {
            fetchInviteDetails();
        }
    }, [inviteCode]);

    const handleJoin = async () => {
        if (!user) return;

        try {
            const res = await fetch('/api/invite/accept', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inviteCode,
                    userId: user.user_id,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/pages/tenant/my-unit');
            } else {
                alert(data.error || 'Failed to join unit.');
            }
        } catch (error) {
            console.error('Join failed:', error);
            alert('An error occurred while joining the unit.');
        }
    };

    if (loading || loadingInvite) return <div className="p-4 text-center">Loading...</div>;

    if (expired || !inviteDetails) {
        return (
            <div className="p-4 text-center text-red-600">
                Invite link is invalid or has expired.
            </div>
        );
    }


     return (
         <div
             className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden"
             style={{
                 backgroundImage: `url(${inviteDetails.property_photo || "/placeholder.jpg"})`,
                 backgroundSize: "cover",
                 backgroundPosition: "center",
             }}
         >
             {/* Overlay for readability */}
             <div className="absolute inset-0 bg-black/50" />

             {/* Centered card */}
             <div className="relative z-10 max-w-md w-full mx-auto p-8 rounded-2xl text-center shadow-lg bg-white/90 backdrop-blur-sm">
                 <h1 className="text-2xl font-bold text-gray-800 mb-2">You're Invited!</h1>
                 <p className="text-gray-600 mb-6">
                     You’ve been invited to join this unit as a tenant. Access your lease, payments, and updates all in one place.
                 </p>

                 <div className="bg-white border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
                     <p className="text-lg font-semibold text-blue-800 mb-1">
                         {inviteDetails.property_name}
                     </p>
                     <p className="text-gray-700">
                         Unit:{" "}
                         <span className="font-medium text-gray-900">
            {inviteDetails.unit_name}
          </span>
                     </p>
                 </div>
                 <button
                     onClick={handleJoin}
                     className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                 >
                     Accept Invitation & Join Unit
                 </button>
             </div>
         </div>
     );



 }


export default function InviteRegisterPage() {
    return (
        <Suspense fallback={<div className="p-4 text-center">Loading invite...</div>}>
            <TenantInviteJoinPage />
        </Suspense>
    );
}