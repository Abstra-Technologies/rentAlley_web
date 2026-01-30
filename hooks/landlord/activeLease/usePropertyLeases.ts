"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import axios from "axios";
import Swal from "sweetalert2";
export const fetcher = (url: string) => axios.get(url).then(res => res.data);

/* ===============================
   HELPERS
================================ */
const isEndingWithin60Days = (endDate?: string | null) => {
    if (!endDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diff =
        (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

    return diff >= 0 && diff <= 60;
};

const getStatus = (lease: any) =>
    (lease.status ?? lease.lease_status)?.toLowerCase();

/* ===============================
   HOOK
================================ */
export function usePropertyLeases(propertyId: string) {
    const { data, error, isLoading } = useSWR(
        `/api/landlord/activeLease/getByProperty?property_id=${propertyId}`,
        fetcher,
        {
            refreshInterval: 2000,
            revalidateOnFocus: false,
        }
    );

    const [search, setSearch] = useState("");
    const [selectedLease, setSelectedLease] = useState<any>(null);
    const [setupModalLease, setSetupModalLease] = useState<any>(null);
    const [selectedKypLease, setSelectedKypLease] = useState<any | null>(null);
    const [kypOpen, setKypOpen] = useState(false);

    const leases = data?.leases || [];
    const stats = data?.stats;

    /* ===============================
       FILTERING
    ================================ */
    const filteredLeases = useMemo(() => {
        if (!search.trim()) return leases;
        const q = search.toLowerCase();

        return leases.filter((l: any) =>
            l.unit_name?.toLowerCase().includes(q) ||
            l.tenant_name?.toLowerCase().includes(q) ||
            l.invite_email?.toLowerCase().includes(q) ||
            getStatus(l)?.includes(q)
        );
    }, [leases, search]);

    /* ===============================
       SCORECARDS (UI ONLY)
    ================================ */
    const scorecards = useMemo(() => {
        const active = filteredLeases.filter(
            (l: any) => getStatus(l) === "active"
        ).length;

        const expiringSoon = filteredLeases.filter(
            (l: any) =>
                getStatus(l) === "active" &&
                isEndingWithin60Days(l.end_date)
        ).length;

        const pendingSignatures = filteredLeases.filter((l: any) =>
            [
                "pending_signature",
                "landlord_pending_signature",
                "tenant_pending_signature",
            ].includes(getStatus(l))
        ).length;

        return {
            active,
            expiringSoon,
            pendingSignatures,
        };
    }, [filteredLeases]);

    /* ===============================
       ACTIONS
    ================================ */
    const handleEndLease = async (lease: any) => {
        const result = await Swal.fire({
            title: "End Lease?",
            text: "This will permanently mark the lease as completed.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, end lease",
            confirmButtonColor: "#d33",
        });

        if (!result.isConfirmed) return;

        try {
            Swal.fire({
                title: "Ending lease...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            await axios.post("/api/landlord/activeLease/endLease", {
                agreement_id: lease.lease_id,
            });

            Swal.fire("Success", "Lease completed.", "success");
        } catch (err: any) {
            Swal.fire(
                "Error",
                err?.response?.data?.message ||
                "Something went wrong. Please try again.",
                "error"
            );
        }
    };

    return {
        // data
        leases,
        filteredLeases,
        stats,
        scorecards,

        // state
        search,
        setSearch,
        selectedLease,
        setSelectedLease,
        setupModalLease,
        setSetupModalLease,
        selectedKypLease,
        setSelectedKypLease,
        kypOpen,
        setKypOpen,

        // status
        isLoading,
        error,

        // helpers
        getStatus,

        // actions
        handleEndLease,
    };
}
