"use client";
import { useRouter } from "next/navigation";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import axios from "axios";

interface NoTenantAssignedProps {
    unitId: string;
    handleSendInvite: (email: string) => Promise<void>;
}

const NoTenantAssigned: React.FC<NoTenantAssignedProps> = ({ unitId, handleSendInvite }) => {
    const router = useRouter();
    const [inviteEmail, setInviteEmail] = useState("");
    const [sentInvitation, setSentInvitation] = useState<{ email: string; expiresAt: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Format expiration date for display
    const formatExpirationDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        } catch (error) {
            console.error("Error formatting expiration date:", error);
            return "Invalid Date";
        }
    };

    // Fetch sent invitation status
    useEffect(() => {
        const fetchSentInvitation = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`/api/invite/check?unit_id=${unitId}`);
                if (response.data && response.data.email) {
                    setSentInvitation({
                        email: response.data.email,
                        expiresAt: response.data.expiresAt,
                    });
                }
            } catch (error) {
                console.error("Error checking sent invitation:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSentInvitation();
    }, [unitId]);

    const onSendInvite = async () => {
        await handleSendInvite(inviteEmail);
        setInviteEmail(""); // Clear input after sending
    };

    return (
        <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mt-0.5">
                    <EnvelopeIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-amber-800 mb-2">No Tenant Assigned</h3>
                    {isLoading ? (
                        <p className="text-amber-700 text-sm mb-4">Checking invitation status...</p>
                    ) : sentInvitation ? (
                        <p className="text-amber-700 text-sm mb-4">
                            An invitation has already been sent to <span className="font-semibold">{sentInvitation.email}</span>.
                            Expires on <span className="font-semibold">{formatExpirationDate(sentInvitation.expiresAt)}</span>.
                        </p>
                    ) : (
                        <p className="text-amber-700 text-sm mb-4">
                            Send an invitation to connect a tenant to this unit. They'll receive an email with registration instructions.
                        </p>
                    )}

                    {!sentInvitation && (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <input
                                    type="email"
                                    placeholder="Enter tenant's email address"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full bg-white border border-amber-200 px-4 py-2.5 rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-300 focus:border-amber-400 outline-none transition-all"
                                />
                            </div>
                            <button
                                onClick={onSendInvite}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Send Invite
                            </button>
                        </div>
                    )}

                    <button
                        className="mt-3 text-blue-600 hover:text-blue-800 underline font-medium text-sm"
                        onClick={() => router.push(`/pages/landlord/property-listing/view-unit/tenant-req/${unitId}`)}
                    >
                        View prospective tenants instead
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoTenantAssigned;