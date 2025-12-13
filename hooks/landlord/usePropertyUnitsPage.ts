"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { mutate } from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import Fuse from "fuse.js";
import {
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import useAuthStore from "@/zustand/authStore";
import { usePropertyData } from "@/hooks/usePropertyData";

export function usePropertyUnitsPage() {
    const router = useRouter();
    const params = useParams();

    const property_id =
        typeof params?.id === "string" ? params.id : null;

    const { fetchSession, user } = useAuthStore();
    const landlord_id = user?.landlord_id ?? null;

    /* ---------------- DEBUG: PARAMS & AUTH ---------------- */
    useEffect(() => {
        console.log("[DEBUG usePropertyUnitsPage] params:", params);
        console.log("[DEBUG usePropertyUnitsPage] property_id:", property_id);
        console.log("[DEBUG usePropertyUnitsPage] landlord_id:", landlord_id);
        console.log("[DEBUG usePropertyUnitsPage] user:", user);
    }, [params, property_id, landlord_id, user]);

    /* ---------------- AUTH ---------------- */

    useEffect(() => {
        if (!user) {
            console.log("[DEBUG AUTH] fetching session...");
            fetchSession();
        }
    }, [user, fetchSession]);

    /* ---------------- DATA ---------------- */

    const {
        subscription,
        units = [],
        error,
        isLoading,
        loadingProperty,
        loadingSubscription,
        loadingUnits,
    } = usePropertyData(property_id!, landlord_id);

    /* ---------------- DEBUG: LOADING STATES ---------------- */

    useEffect(() => {
        console.log("[DEBUG LOADING STATES]", {
            loadingProperty,
            loadingSubscription,
            loadingUnits,
            combinedIsLoading: isLoading,
        });
    }, [loadingProperty, loadingSubscription, loadingUnits, isLoading]);

    /* ---------------- DEBUG: DATA ---------------- */

    useEffect(() => {
        console.log("[DEBUG DATA]", {
            subscription,
            unitsLength: units.length,
            units,
            error,
        });
    }, [subscription, units, error]);

    /* ---------------- STATE ---------------- */

    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const [searchQuery, setSearchQuery] = useState("");
    const [draggableUnits, setDraggableUnits] = useState<any[]>([]);

    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [bulkImportModal, setBulkImportModal] = useState(false);

    /* ---------------- EFFECTS ---------------- */

    useEffect(() => {
        if (Array.isArray(units)) {
            console.log("[DEBUG EFFECT] syncing draggableUnits");
            setDraggableUnits(units);
        }
    }, [units]);

    /* ---------------- SEARCH ---------------- */

    const fuse = useMemo(
        () => {
            console.log("[DEBUG FUSE] building index");
            return new Fuse(units, {
                keys: ["unit_name", "unit_style", "furnish", "amenities", "status"],
                threshold: 0.3,
            });
        },
        [units]
    );

    const filteredUnits = useMemo(() => {
        if (!searchQuery.trim()) return draggableUnits;

        console.log("[DEBUG SEARCH]", searchQuery);
        return fuse.search(searchQuery).map((r) => r.item);
    }, [searchQuery, fuse, draggableUnits]);

    const startIndex = (page - 1) * itemsPerPage;
    const currentUnits = filteredUnits.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    /* ---------------- DEBUG: PAGINATION ---------------- */

    useEffect(() => {
        console.log("[DEBUG PAGINATION]", {
            page,
            startIndex,
            currentUnitsLength: currentUnits.length,
            filteredUnitsLength: filteredUnits.length,
        });
    }, [page, startIndex, currentUnits, filteredUnits]);

    /* ---------------- DND ---------------- */

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        console.log("[DEBUG DND]", { active: active.id, over: over.id });

        setDraggableUnits((prev) => {
            const oldIndex = prev.findIndex((u) => u.unit_id === active.id);
            const newIndex = prev.findIndex((u) => u.unit_id === over.id);
            return arrayMove(prev, oldIndex, newIndex);
        });
    };

    /* ---------------- ACTIONS ---------------- */

    const handleAddUnitClick = () => {
        console.log("[DEBUG ACTION] Add Unit clicked");

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
        console.log("[DEBUG ACTION] Edit Unit", unitId);
        router.push(
            `/pages/landlord/properties/${property_id}/units/edit/${unitId}`
        );
    };

    const handleDeleteUnit = async (unitId: number) => {
        console.log("[DEBUG ACTION] Delete Unit", unitId);

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

        sensors,
        handleDragEnd,

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
