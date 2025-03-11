"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useAuth from "../../../../../../../../hooks/useSession";
import LoadingScreen from "../../../../../../../components/loadingScreen";


export default function LandlordDetails() {
    const router = useRouter();
    const params = useParams();
    const landlord_id = params.landlord_id;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {admin} = useAuth();
    const [landlord, setLandlord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);


    useEffect(() => {
        if (landlord_id) {
            fetch(`/api/landlord/verificationDetails/${landlord_id}`)
                .then((res) => res.json())
                .then((data) => {
                    setLandlord(data);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching landlord details:", error);
                    setLoading(false);
                });
        }
    }, [landlord_id]);

    const handleVerification = async (status) => {

        if (status === "rejected" && message.trim() === "") {
            alert("Please provide a reason for rejection.");
            return;
        }
        setIsSubmitting(true);

        try{
            const res = await fetch("/api/landlord/updateVerificationStatus", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    landlord_id,
                    status,
                    message: message || null,
                    document_url: landlord.verification.document_url,
                    selfie_url: landlord.verification.selfie_url,
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Verification ${status} successfully.`);
            } else {
                alert(data.error || "Something went wrong.");
            }
        }catch (error) {
            console.error("Error updating verification status:", error);
        }
        setIsSubmitting(true);
    }

    if (loading) return  <LoadingScreen />;
    if (!landlord) return <p className="text-center text-red-500">Landlord not found.</p>;

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Landlord Details</h2>
            <div className="bg-gray-100 p-4 rounded">
                <p><strong>Landlord ID:</strong> {landlord?.landlord?.landlord_id}</p>
                <p><strong>User ID:</strong> {landlord?.landlord?.user_id}</p>
                <p><strong>Verified:</strong> {landlord?.verification?.status}</p>
                <p><strong>Citizenship:</strong> {landlord?.landlord?.citizenship}</p>
                <p><strong>Address:</strong> {landlord?.landlord?.address}</p>
                <p><strong>Trial Used:</strong> {landlord?.landlord?.is_trial_used ? "✅ Yes" : "❌ No"}</p>
            </div>

            {landlord.verification ? (
                <div className="bg-gray-100 p-4 rounded mt-4">
                    <h3 className="text-xl font-bold">Verification Details</h3>
                    <p><strong>Document Type:</strong> {landlord?.verification?.document_type}</p>
                    <p><strong>Reviewed By:</strong> {landlord?.verification?.reviewed_by || "Not yet reviewed"}</p>
                    <p><strong>Review Date:</strong> {landlord?.verification?.review_date || "Not yet reviewed"}</p>
                    {landlord?.verification?.message && (
                        <p className="text-red-500"><strong>Rejection Reason:</strong> {landlord?.verification?.message}</p>
                    )}
                    <div className="mt-4">
                        <p><strong>Document:</strong></p>
                        <img src={landlord?.verification?.document_url} alt="Document" className="w-64 h-auto border" />
                    </div>
                    <div className="mt-4">
                        <p><strong>Selfie:</strong></p>
                        <img src={landlord?.verification?.selfie_url} alt="Selfie" className="w-64 h-auto border" />
                    </div>

                    {landlord?.verification?.status === "pending" && (
                        <div className="mt-4">
                            <textarea
                                className="w-full p-2 border rounded mb-2"
                                placeholder="Add a rejection reason (if rejecting)..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            ></textarea>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleVerification("approved")}
                                    className="px-4 py-2 bg-green-600 text-white rounded"
                                    disabled={isSubmitting}
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleVerification("rejected")}
                                    className="px-4 py-2 bg-red-600 text-white rounded"
                                    disabled={isSubmitting}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <p className="mt-4 text-red-500">No verification details available.</p>
            )}

            <button
                onClick={() => router.push("/pages/system_admin/tenant_landlord/verification")}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
                Back to List
            </button>
        </div>
    );
}