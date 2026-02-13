"use client";

import Swal from "sweetalert2";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";

interface XenditRedirectUrls {
    success: string;
    failure: string;
}

interface UseXenditPaymentParams {
    billing_id: string;
    redirectUrl?: XenditRedirectUrls;
}

export function useXenditPayment() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loadingPayment, setLoadingPayment] = useState(false);

    const payWithXendit = async ({
                                     billing_id,
                                     redirectUrl,
                                 }: UseXenditPaymentParams) => {
        if (!user?.tenant_id) {
            Swal.fire("Error", "Tenant information missing.", "error");
            return;
        }

        const confirm = await Swal.fire({
            title: "Pay Billing Now?",
            text: "You will be redirected to Xendit's secure checkout page.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Proceed",
        });

        if (!confirm.isConfirmed) return;

        setLoadingPayment(true);

        try {
            const res = await axios.post(
                "/api/tenant/billing/payment",
                {
                    billing_id,
                    tenant_id: user.tenant_id,

                    firstName: user?.firstName ?? null,
                    lastName: user?.lastName ?? null,
                    emailAddress: user?.email ?? null,
                    phoneNumber: user?.phoneNumber ?? null,

                    redirectUrl: redirectUrl ?? {
                        success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billSuccess`,
                        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billFailed`,
                    },
                }
            );

            const checkoutUrl = res.data?.checkoutUrl;

            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                console.error("No checkout URL returned:", res.data);
                Swal.fire(
                    "Error",
                    "Payment session created but no redirect URL returned.",
                    "error"
                );
            }
        } catch (err: any) {
            console.error("Xendit payment error:", err);

            const message =
                err?.response?.data?.error ||
                "Failed to initiate payment.";

            Swal.fire("Payment Error", message, "error");
        } finally {
            setLoadingPayment(false);
        }
    };

    return {
        payWithXendit,
        loadingPayment,
    };
}
