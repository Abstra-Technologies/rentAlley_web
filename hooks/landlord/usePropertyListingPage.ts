"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
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
        user?.landlord_id
    );

    /* ================= STATE ================= */
    const [verificationStatus, setVerificationStatus] =
        useState<string>("not verified");
    const [isFetchingVerification, setIsFetchingVerification] =
        useState<boolean>(true);
    const [isNavigating, setIsNavigating] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);

    const itemsPerPage = 9;

    /* ================= SESSION ================= */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /* ================= PROPERTIES ================= */
    useEffect(() => {
        if (user?.landlord_id) {
            fetchAllProperties(user.landlord_id);
        }
    }, [user?.landlord_id, fetchAllProperties]);

    /* ================= VERIFICATION ================= */
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

    /* ================= DERIVED (IMPORTANT) ================= */

    // ✅ TOTAL count — never filtered
    const totalPropertyCount = properties.length;

    // ✅ SINGLE SOURCE OF TRUTH for limits
    const maxProperties =
        subscription?.limits?.maxProperties ??
        subscription?.listingLimits?.maxProperties ??
        null;

    const hasReachedLimit =
        maxProperties !== null && totalPropertyCount >= maxProperties;

    // ✅ UI-only filtered list
    const filteredProperties = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return properties.filter((p: any) =>
            p.property_name?.toLowerCase().includes(q) ||
            p.address?.toLowerCase().includes(q) ||
            p.city?.toLowerCase().includes(q)
        );
    }, [properties, searchQuery]);

    /* ================= ACTIONS ================= */

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
                    });
                    return;
                }

                router.push(`/pages/landlord/properties/${property.property_id}`);
            } catch {
                await Swal.fire("Error", "Unable to validate property access.", "error");
            }
        },
        [router, user?.landlord_id]
    );

    const handleAddProperty = useCallback(() => {
        if (verificationStatus !== "approved") {
            Swal.fire("Verification Required", "", "warning");
            return;
        }

        if (!subscription || subscription.is_active !== 1) {
            Swal.fire("Subscription Required", "", "info");
            return;
        }

        if (hasReachedLimit) {
            Swal.fire(
                "Limit Reached",
                `You’ve reached your plan limit of ${maxProperties} properties.`,
                "error"
            );
            return;
        }

        setIsNavigating(true);
        router.push("/pages/landlord/property-listing/create-property");
    }, [
        verificationStatus,
        subscription,
        hasReachedLimit,
        maxProperties,
        router,
    ]);

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

            if (res.ok && user?.landlord_id) {
                fetchAllProperties(user.landlord_id);
            }
        },
        [fetchAllProperties, user?.landlord_id]
    );

    /* ================= UI FLAGS ================= */

    const isAddDisabled =
        isFetchingVerification ||
        loadingSubscription ||
        isNavigating ||
        !subscription ||
        subscription.is_active !== 1 ||
        verificationStatus !== "approved" ||
        hasReachedLimit;

    /* ================= RETURN ================= */
    return {
        // data
        user,
        subscription,
        properties,
        filteredProperties,
        totalPropertyCount,
        maxProperties,

        // flags
        loading,
        error,
        hasReachedLimit,
        isAddDisabled,

        // ui
        page,
        setPage,
        searchQuery,
        setSearchQuery,

        // handlers
        handleView,
        handleAddProperty,
        handleDelete,

        // pagination
        itemsPerPage,
    };
}
