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

     if (loading || loadingInvite)
         return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50">
                 {/* Animated spinner */}
                 <div className="relative w-12 h-12 mb-6">
                     <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                     <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
                 </div>

                 {/* Animated text */}
                 <p className="text-gray-700 font-medium text-base sm:text-lg animate-pulse text-center px-6">
                     Loading your <span className="text-blue-700 font-semibold">Invitation details</span>...
                 </p>
             </div>
         );

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
             {/* Dark gradient overlay for readability */}
             <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/70" />

             {/* Centered responsive card */}
             <div className="relative z-10 w-[90%] max-w-md mx-auto px-6 sm:px-8 py-10 rounded-3xl text-center shadow-2xl bg-white/90 backdrop-blur-md border border-white/30">
                 <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
                     You’re Invited!
                 </h1>

                 <p className="text-gray-600 mb-8 text-sm sm:text-base leading-relaxed">
                     You’ve been invited to join this unit as a tenant. Access your lease,
                     payments, and updates all in one place.
                 </p>

                 {/* Property & Unit Info */}
                 <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-2xl p-5 mb-8 shadow-inner text-left sm:text-center">
                     <p className="text-base sm:text-lg font-semibold text-blue-800 mb-1 break-words">
                         {inviteDetails.property_name}
                     </p>

                     <p className="text-gray-700 text-sm sm:text-base">
                         Unit:
                         <span
                             className="block mt-2 text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text
                       bg-gradient-to-r from-blue-600 to-emerald-600 tracking-tight drop-shadow-sm"
                         >
            {inviteDetails.unit_name}
          </span>
                     </p>
                 </div>

                 {/* CTA Button */}
                 <button
                     onClick={handleJoin}
                     className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700
                   text-white font-semibold py-3.5 sm:py-4 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
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