"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";
import { usePropertyData } from "@/hooks/usePropertyData";

export function usePropertyUnitsPage() {
    const router = useRouter();
    const params = useParams();

    const property_id =
        typeof params?.id === "string" ? params.id : null;

    const { fetchSession, user } = useAuthStore();
    const landlord_id = user?.landlord_id ?? null;

    /* ---------------- AUTH ---------------- */

    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /* ---------------- DATA ---------------- */

    const {
        subscription,
        units = [],
        error,
        isLoading,
    } = usePropertyData(property_id!, landlord_id);

    /* ---------------- STATE ---------------- */

    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const [searchQuery, setSearchQuery] = useState("");

    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [bulkImportModal, setBulkImportModal] = useState(false);

    /* ---------------- SIMPLE SEARCH ---------------- */

    const filteredUnits = useMemo(() => {
        if (!searchQuery.trim()) return units;

        const q = searchQuery.toLowerCase();

        return units.filter((unit: any) =>
            [
                unit.unit_name,
                unit.unit_style,
                unit.furnish,
                unit.amenities,
                unit.status,
            ]
                .filter(Boolean)
                .some((field) =>
                    String(field).toLowerCase().includes(q)
                )
        );
    }, [searchQuery, units]);

    /* ---------------- PAGINATION ---------------- */

    const startIndex = (page - 1) * itemsPerPage;
    const currentUnits = filteredUnits.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    /* ---------------- ACTIONS ---------------- */

    const handleAddUnitClick = () => {
        if (!subscription || subscription.is_active !== 1) {
            Swal.fire(
                "Subscription Required",
                "Please activate your subscription.",
                "info"
            );
            return;
        }

        if (units.length >= subscription.listingLimits?.maxUnits) {
            Swal.fire(
                "Limit Reached",
                "You’ve reached your unit limit.",
                "error"
            );
            return;
        }

        router.push(
            `/pages/landlord/properties/${property_id}/units/create?property_id=${property_id}`
        );
    };

    const handleEditUnit = (unitId: number) => {
        router.push(
            `/pages/landlord/properties/${property_id}/units/edit/${unitId}`
        );
    };

    const handleDeleteUnit = async (unitId: number) => {
        const confirm = await Swal.fire({
            title: "Delete unit?",
            icon: "warning",
            showCancelButton: true,
        });

        if (!confirm.isConfirmed) return;

        await axios.delete(`/api/unitListing/deleteUnit?id=${unitId}`);
        mutate(`/api/propertyListing/property/${property_id}`);
    };

    return {
        property_id,
        subscription,
        error,
        isLoading,

        page,
        setPage,
        itemsPerPage,

        searchQuery,
        setSearchQuery,

        filteredUnits,
        currentUnits,

        handleAddUnitClick,
        handleEditUnit,
        handleDeleteUnit,

        isAIGeneratorOpen,
        setIsAIGeneratorOpen,
        inviteModalOpen,
        setInviteModalOpen,
        bulkImportModal,
        setBulkImportModal,
    };
}
