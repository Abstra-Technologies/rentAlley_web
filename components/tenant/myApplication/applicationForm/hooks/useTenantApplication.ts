"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";
import { TenantApplicationFormData } from "../types";

export function useTenantApplication(unit_id?: string) {
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [hasApplied, setHasApplied] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [propertyDetails, setPropertyDetails] = useState<any>(null);

    const [formData, setFormData] = useState<TenantApplicationFormData>({
        unit_id: "",
        firstName: "",
        lastName: "",
        birthDate: "",
        phoneNumber: "",
        email: "",
        address: "",
        occupation: "",
        employment_type: "",
        monthly_income: "",
    });

    const validIdRef = useRef<HTMLInputElement>(null);
    const incomeRef = useRef<HTMLInputElement>(null);
    const [validIdFile, setValidIdFile] = useState<File | null>(null);
    const [incomeFile, setIncomeFile] = useState<File | null>(null);

    /* ================= Effects ================= */

    useEffect(() => {
        if (!user || !unit_id) return;

        setFormData((prev) => ({
            ...prev,
            unit_id,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            birthDate: user.birthDate || "",
            phoneNumber: user.phoneNumber || "",
            email: user.email || "",
            address: user.address || "",
        }));
    }, [user, unit_id]);

    useEffect(() => {
        if (!user || !unit_id) return;

        axios
            .get("/api/tenant/applications/alreadyApplied", {
                params: { tenant_id: user.tenant_id, unit_id },
            })
            .then((res) => setHasApplied(res.data.hasApplied))
            .finally(() => setLoading(false));
    }, [user, unit_id]);

    useEffect(() => {
        if (!unit_id) return;
        axios
            .get("/api/propertyListing/getPropertyDetailByUnitId", {
                params: { unit_id },
            })
            .then((res) => setPropertyDetails(res.data.propertyDetails));
    }, [unit_id]);

    /* ================= Helpers ================= */

    const handleFile = (file: File, type: "id" | "income") => {
        if (file.size > 15 * 1024 * 1024) {
            Swal.fire("Error", "File exceeds 15MB", "error");
            return;
        }
        type === "id" ? setValidIdFile(file) : setIncomeFile(file);
    };

    return {
        user,
        loading,
        hasApplied,
        activeStep,
        setActiveStep,
        formData,
        setFormData,
        validIdFile,
        incomeFile,
        validIdRef,
        incomeRef,
        propertyDetails,
        isSubmitting,
        setIsSubmitting,
        handleFile,
    };
}
