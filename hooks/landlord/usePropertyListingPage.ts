"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import useSubscription from "@/hooks/landlord/useSubscription";

export default function usePropertyListingPage() {
    const router = useRouter();

    const { fetchSession, user } = useAuthStore();
    const { properties, fetchAllProperties, loading, error } =
        usePropertyStore();

    const { subscription, loadingSubscription } = useSubscription(
        user?.landlord_id ?? null
    );

    const [verificationStatus, setVerificationStatus] =
        useState<string>("not verified");
    const [isFetchingVerification, setIsFetchingVerification] =
        useState<boolean>(true);
    const [pendingApproval, setPendingApproval] = useState<boolean>(false);
    const [isNavigating, setIsNavigating] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);

    const itemsPerPage = 9;

    /* ---------------- SESSION ---------------- */

    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /* ---------------- PROPERTIES ---------------- */

    useEffect(() => {
        if (user?.landlord_id) {
            fetchAllProperties(user.landlord_id);
        }
    }, [user?.landlord_id, fetchAllProperties]);

    useEffect(() => {
        if (!properties.length) return;

        setPendingApproval(
            properties.some(
                (p: any) => p?.verification_status?.toLowerCase() !== "verified"
            )
        );
    }, [properties]);

    /* ---------------- VERIFICATION ---------------- */

    useEffect(() => {
        if (user?.userType !== "landlord") return;

        setIsFetchingVerification(true);

        axios
            .get(`/api/landlord/verification-upload/status?user_id=${user.user_id}`)
            .then((res) => {
                setVerificationStatus(
                    (res.data.verification_status || "not verified").toLowerCase()
                );
            })
            .catch(() => {
                setVerificationStatus("not verified");
            })
            .finally(() => {
                setIsFetchingVerification(false);
            });
    }, [user]);

    /* ---------------- ACTIONS ---------------- */

    const handleView = useCallback(
        async (property: any, event: React.MouseEvent) => {
            event.stopPropagation();

            try {
                const res = await fetch("/api/landlord/subscription/limits", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        landlord_id: user?.landlord_id,
                        property_id: property.property_id,
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    await Swal.fire({
                        icon: "error",
                        title: "Access Denied",
                        text: data.error,
                        confirmButtonColor: "#ef4444",
                    });
                    return;
                }
                router.push(`/pages/landlord/properties/${property.property_id}/editPropertyDetails?id=${property.property_id}`);
                // router.push(`/pages/landlord/properties/${property.property_id}`);
            } catch {
                await Swal.fire("Error", "Unable to validate property access.", "error");
            }
        },
        [router, user]
    );

    const handleAddProperty = () => {
        if (verificationStatus !== "approved") {
            Swal.fire("Verification Required", "", "warning");
            return;
        }

        if (!subscription || subscription.is_active !== 1) {
            Swal.fire("Subscription Required", "", "info");
            return;
        }

        if (
            properties.length >=
            (subscription.listingLimits?.maxProperties || 0)
        ) {
            Swal.fire("Limit Reached", "", "error");
            return;
        }

        setIsNavigating(true);
        router.push("/pages/landlord/property-listing/create-property");
    };

    const handleDelete = useCallback(
        async (propertyId: string | number, event: React.MouseEvent) => {
            event.stopPropagation();

            const confirm = await Swal.fire({
                title: "Are you sure?",
                icon: "warning",
                showCancelButton: true,
            });

            if (!confirm.isConfirmed) return;

            const res = await fetch(
                `/api/propertyListing/deletePropertyListing/${propertyId}`,
                { method: "DELETE" }
            );

            if (res.ok) {
                fetchAllProperties(user?.landlord_id);
            }
        },
        [fetchAllProperties, user?.landlord_id]
    );

    /* ---------------- DERIVED ---------------- */

    const isAddDisabled =
        isFetchingVerification ||
        loadingSubscription ||
        verificationStatus !== "approved" ||
        !subscription ||
        subscription?.is_active !== 1 ||
        isNavigating;

    const filteredProperties = properties.filter((p: any) => {
        const q = searchQuery.toLowerCase();
        return (
            p.property_name?.toLowerCase().includes(q) ||
            p.address?.toLowerCase().includes(q) ||
            p.city?.toLowerCase().includes(q)
        );
    });

    return {
        // data
        user,
        properties,
        filteredProperties,
        subscription,
        loading,
        error,

        // ui state
        page,
        setPage,
        searchQuery,
        setSearchQuery,
        verificationStatus,
        pendingApproval,
        isAddDisabled,

        // handlers
        handleView,
        handleAddProperty,
        handleDelete,

        // pagination
        itemsPerPage,
    };
}
