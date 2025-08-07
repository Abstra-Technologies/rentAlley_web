"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import useAuthStore from "../../../../zustand/authStore";
import TenantOutsidePortalNav from "../../../../components/navigation/TenantOutsidePortalNav";
import { ChatBubbleLeftRightIcon, PencilSquareIcon, XCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { IoChatboxEllipsesSharp } from "react-icons/io5";
import InstallPrompt from "@/components/Commons/installPrompt";

interface Unit {
    unit_id: string;
    unit_name: string;
    unit_size: string;
    bed_spacing: number;
    avail_beds: number;
    rent_amount: number;
    furnish: string;
    status: string;
    sec_deposit: number;
    advanced_payment: number;
    unit_photos: string[];
    property_name: string;
    property_type: string;
    city: string;
    province: string;
    street: string;
    zip_code: string;
    brgy_district: string;
    agreement_id: string;
    start_date: string;
    end_date: string;
    is_advance_payment_paid: number;
    is_security_deposit_paid: number;
}

export default function MyUnit() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPayment, setLoadingPayment] = useState(false);

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const res = await axios.get(`/api/tenant/activeRent?tenantId=${user?.tenant_id}`);
                setUnits(res.data);
                console.log('res', res);
                console.log('res', res.data);
            } catch (err: any) {
                Swal.fire("Warning", err.response?.data?.message || "Failed to load units", "warning");
            } finally {
                setLoading(false);
            }
        };
        if (user?.tenant_id) fetchUnits();
    }, [user]);

    if (loading) return <p className="text-center mt-10">Loading your units...</p>;

    const handleUploadProof = async (unitId: string) => {
        const { value: file } = await Swal.fire({
            title: "Upload Proof of Payment",
            input: "file",
            inputAttributes: {
                accept: "image/*,application/pdf",
                "aria-label": "Upload your payment proof",
            },
            showCancelButton: true,
            confirmButtonText: "Upload",
        });

        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("unit_id", unitId);
        formData.append("tenant_id", user?.tenant_id || "");

        try {
            const res = await axios.post("/api/tenant/payment/uploadProofPayment", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.status === 200) {
                Swal.fire("Uploaded", "Your proof of payment has been submitted!", "success");
            } else {
                throw new Error("Upload failed");
            }
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to upload proof of payment.", "error");
        }
    };

    const handleUnitPayment = async (unitId: string) => {
        const unit = units.find(u => u.unit_id === unitId);

        if (!unit) {
            Swal.fire("Error", "Unit not found.", "error");
            return;
        }

        const items = [];

        if (!unit.is_security_deposit_paid) {
            items.push({
                name: "Security Deposit",
                type: "SECURITY_DEPOSIT",
                amount: Number(unit.sec_deposit), // ✅ ensure it's a number
            });
        }

        if (!unit.is_advance_payment_paid) {
            items.push({
                name: "Advance Payment",
                type: "ADVANCE_PAYMENT",
                amount: Number(unit.advanced_payment), // ✅ ensure it's a number
            });
        }

        const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

        if (items.length === 0 || totalAmount <= 0) {
            Swal.fire("No Payment Needed", "Both payments are already settled.", "info");
            return;
        }

        const itemDescriptions = items.map(item => item.name).join(" and ");

        const result = await Swal.fire({
            title: `Pay ${itemDescriptions}?`,
            text: `Pay ₱${totalAmount.toLocaleString()} for ${itemDescriptions}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Pay Now",
            cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed || !user) return;

        setLoadingPayment(true);

        try {
            const payload = {
                agreement_id: unit.agreement_id,
                items: items.map(item => ({ type: item.type, amount: item.amount })),
                payment_method_id: 1,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                redirectUrl: {
                    success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/secSuccess`,
                    failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/secFailed`,
                    cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/secCancelled`,
                },
            };

            const response = await axios.post("/api/tenant/initialPayment", payload);
            if (response.status === 200) {
                window.location.href = response.data.checkoutUrl;
            }
        } catch (error) {
            Swal.fire("Payment Failed", "An error occurred during payment.", "error");
        } finally {
            setLoadingPayment(false);
        }
    };

    const handleContactLandlord = () => {
        // @ts-ignore
        if (!units?.[0]?.landlord_id) return;

        // @ts-ignore
        const chatRoom = `chat_${[user?.user_id, units[0].landlord_id].sort().join("_")}`;

        // @ts-ignore
        const chatUrl = `/pages/commons/chat?chat_room=${chatRoom}&landlord_id=${units[0].landlord_id}`;

        Swal.fire({
            title: "Redirecting...",
            text: "Taking you to the chat room...",
            icon: "info",
            timer: 1500,
            showConfirmButton: false,
            didClose: () => router.push(chatUrl),
        });
    };


    return (
        <div className="flex min-h-screen bg-gray-50">
            <TenantOutsidePortalNav />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-semibold mb-6">My Current Rented Units {user?.tenant_id}</h1>
                <button
                    className="mb-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200"
                    onClick={() => {
                        router.push("/pages/tenant/viewInvites");
                    }}
                >
                    View Invitations
                </button>
                {units.length === 0 ? (
                    <p className="text-gray-500">You currently have no active leases.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {units.map((unit) => {
                            const showPayButton = !unit.is_advance_payment_paid || !unit.is_security_deposit_paid;
                            return (
                                <div
                                    key={unit.unit_id}
                                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300"
                                >
                                    <div className="h-48 w-full relative">
                                        <Image
                                            src={unit.unit_photos?.[0] || "/placeholder.jpg"}
                                            alt="Unit photo"
                                            layout="fill"
                                            objectFit="cover"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h2 className="text-xl font-bold">Unit {unit.unit_name}</h2>
                                        <p className="text-sm text-gray-600">{unit.property_name} · {unit.city}, {unit.province}</p>
                                        <p className="mt-2 text-sm">₱{unit.rent_amount.toLocaleString()} / month</p>
                                        <p className="text-xs text-gray-500">Lease: {unit.start_date} to {unit.end_date}</p>

                                        <div className="mt-4 flex flex-col gap-2">
                                            {!unit.is_security_deposit_paid && (
                                                <p className="text-sm text-red-500">Security Deposit: {unit?.sec_deposit}</p>
                                            )}
                                            {!unit.is_advance_payment_paid && (
                                                <p className="text-sm text-red-500">Advance Payment: {unit?.advanced_payment}</p>
                                            )}

                                            {(!unit.is_security_deposit_paid || !unit.is_advance_payment_paid) ? (
                                                <div className="mt-2 space-y-2">
                                                    {/* Pay through Maya button */}
                                                    <button
                                                        onClick={() => handleUnitPayment(unit?.unit_id)}
                                                        className="w-full py-2 px-4 text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                                                    >
                                                        Pay through Maya
                                                    </button>

                                                    {/* Upload Proof of Payment button */}
                                                    <button
                                                        onClick={() => handleUploadProof(unit?.unit_id)}
                                                        className="w-full py-2 px-4 text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition"
                                                    >
                                                        Upload Proof of Payment
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => router.push(`/pages/tenant/rentalPortal/${unit?.agreement_id}`)}
                                                    className="mt-2 w-full py-2 px-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                                                >
                                                    Access Portal
                                                </button>
                                            )}

                                            <button
                                                onClick={handleContactLandlord}
                                                className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                                            >
                                                <IoChatboxEllipsesSharp className="w-5 h-5" />
                                                <span className="text-sm font-medium">Message Landlord</span>
                                            </button>

                                        </div>


                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
