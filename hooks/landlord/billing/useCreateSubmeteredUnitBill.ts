"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import { useOnboarding } from "@/hooks/useOnboarding";
import { createUnitBillSteps } from "@/lib/onboarding/createUnitBill";



export function useCreateSubmeteredUnitBill() {
    const { unit_id } = useParams();
    const router = useRouter();



    /* ------------------ DATE ------------------ */
    const today = new Date().toISOString().split("T")[0];

    /* ------------------ STATE ------------------ */
    const [unit, setUnit] = useState<any>(null);
    const [property, setProperty] = useState<any>(null);

    const [propertyRates, setPropertyRates] = useState({
        waterRate: 0,
        electricityRate: 0,
    });

    const [extraExpenses, setExtraExpenses] = useState<any[]>([]);
    const [discounts, setDiscounts] = useState<any[]>([]);

    const [hasExistingBilling, setHasExistingBilling] = useState(false);
    const [existingBillingMeta, setExistingBillingMeta] = useState<any>(null);

    const [pdc, setPdc] = useState<any>(null);
    const [loadingPdc, setLoadingPdc] = useState(false);

    const [isRateModalOpen, setIsRateModalOpen] = useState(false);

    const [form, setForm] = useState({
        billingDate: "",
        readingDate: today,
        dueDate: "",
        waterPrevReading: "",
        waterCurrentReading: "",
        electricityPrevReading: "",
        electricityCurrentReading: "",
    });

    /* ------------------ ONBOARDING ------------------ */
    const { startTour } = useOnboarding({
        tourId: "create-unit-bill",
        steps: createUnitBillSteps,
        autoStart: true,
    });

    /* ------------------ FETCH ------------------ */
    useEffect(() => {
        if (!unit_id) return;
        fetchUnitData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unit_id]);

    useEffect(() => {
        console.log("🔥 PROPERTY RATES UPDATED:", propertyRates);
    }, [propertyRates]);


    const round2 = (n: number) =>
        Math.round((n + Number.EPSILON) * 100) / 100;

    async function fetchUnitData() {
        try {
            const res = await axios.get(
                `/api/landlord/billing/submetered/getUnitBilling?unit_id=${unit_id}`
            );

            const data = res.data;

            console.log('data billing: ', data);

            if (!data.unit || !data.property) {
                throw new Error("Missing unit or property data.");
            }

            setUnit(data.unit);
            setProperty(data.property);

            /* -------- PROPERTY RATES -------- */
            const rateRes = await axios.get(
                `/api/landlord/billing/checkPropertyBillingStats?property_id=${data.property.property_id}`
            );

            const billingData = rateRes.data.billingData;

            console.log('UTILITY RTATES API: ', billingData);

            setPropertyRates({
                waterRate: billingData?.water?.rate ?? 0,
                waterTotal: billingData?.water?.total ?? 0,
                waterConsumption: billingData?.water?.consumption ?? 0,

                electricityRate: billingData?.electricity?.rate ?? 0,
                electricityTotal: billingData?.electricity?.total ?? 0,
                electricityConsumption: billingData?.electricity?.consumption ?? 0,
            });

            console.log('PROPERTY RATES SET: ', propertyRates);



            const eb = data.existingBilling;

            /* -------- FORM HYDRATION -------- */
            setForm((prev) => ({
                ...prev,

                // ✅ KEEP billing_period UNCHANGED
                billingDate: eb?.billing_period,

                readingDate: eb?.reading_date
                    ? eb.reading_date
                    : today,

                dueDate: eb?.due_date ?? "",

                waterPrevReading: eb?.water_prev ?? "",
                waterCurrentReading: eb?.water_curr ?? "",
                electricityPrevReading: eb?.elec_prev ?? "",
                electricityCurrentReading: eb?.elec_curr ?? "",
            }));

            console.log('billing period: ', eb.billing_period);


            /* -------- CHARGES -------- */
            setExtraExpenses(
                eb?.additional_charges?.map((c: any) => ({
                    charge_id: c.id,
                    type: c.charge_type,
                    amount: c.amount,
                    fromDB: true,
                })) || []
            );

            setDiscounts(
                eb?.discounts?.map((d: any) => ({
                    charge_id: d.id,
                    type: d.charge_type,
                    amount: d.amount,
                    fromDB: true,
                })) || []
            );

            /* -------- META -------- */
            const meta = {
                billing_id: eb?.billing_id || null,
                lease_id: eb?.lease_id || null,
            };

            setExistingBillingMeta(meta);
            setHasExistingBilling(!!meta.billing_id);

            if (meta.billing_id || meta.lease_id) {
                fetchPDC(meta.billing_id, meta.lease_id);
            } else {
                setPdc(null);
            }
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to load billing data.", "error");
        }
    }

    /* ------------------ PDC ------------------ */
    async function fetchPDC(billingId?: number, leaseId?: number) {
        try {
            setLoadingPdc(true);

            const res = billingId
                ? await axios.get(`/api/landlord/pdc/getByBilling?billing_id=${billingId}`)
                : await axios.get(`/api/landlord/pdc/getByLease?lease_id=${leaseId}`);

            const found =
                res.data?.pdcs?.find((p: any) => p.status === "pending") ||
                res.data?.pdcs?.find((p: any) => p.status === "cleared") ||
                res.data?.pdcs?.[0] ||
                null;

            setPdc(found);
        } finally {
            setLoadingPdc(false);
        }
    }

    /* ------------------ HANDLERS ------------------ */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleAddExpense = () =>
        setExtraExpenses((p) => [...p, { type: "", amount: 0 }]);

    const handleExpenseChange = (idx: number, field: string, value: any) => {
        setExtraExpenses((prev) => {
            const updated = [...prev];
            updated[idx][field] =
                field === "amount" ? parseFloat(value) || 0 : value;
            return updated;
        });
    };

    const handleRemoveExpense = async (idx: number, item: any) => {
        if (item?.fromDB && item?.charge_id) {
            const confirm = await Swal.fire({
                title: "Delete this charge?",
                icon: "warning",
                showCancelButton: true,
            });
            if (!confirm.isConfirmed) return;

            await axios.delete("/api/billing/non_submetered/deleteCharge", {
                data: { charge_id: item.charge_id },
            });
        }

        setExtraExpenses((p) => p.filter((_, i) => i !== idx));
    };

    const handleAddDiscount = () =>
        setDiscounts((p) => [...p, { type: "", amount: 0 }]);

    const handleDiscountChange = (idx: number, field: string, value: any) => {
        setDiscounts((prev) => {
            const updated = [...prev];
            updated[idx][field] =
                field === "amount" ? parseFloat(value) || 0 : value;
            return updated;
        });
    };

    const handleRemoveDiscount = async (idx: number, item: any) => {
        if (item?.fromDB && item?.charge_id) {
            const confirm = await Swal.fire({
                title: "Delete this discount?",
                icon: "warning",
                showCancelButton: true,
            });
            if (!confirm.isConfirmed) return;

            await axios.delete("/api/billing/non_submetered/deleteCharge", {
                data: { charge_id: item.charge_id },
            });
        }

        setDiscounts((p) => p.filter((_, i) => i !== idx));
    };

    /* ------------------ BILL COMPUTATION ------------------ */
    const bill = useMemo(() => {
        if (!unit || !property) {
            return {
                rent: 0,
                dues: 0,
                waterUsage: 0,
                elecUsage: 0,
                waterCost: 0,
                elecCost: 0,
                totalExtraCharges: 0,
                totalDiscounts: 0,
                adjustedTotal: 0,
            };
        }

        const wPrev = Number(form.waterPrevReading) || 0;
        const wCurr = Number(form.waterCurrentReading) || 0;
        const ePrev = Number(form.electricityPrevReading) || 0;
        const eCurr = Number(form.electricityCurrentReading) || 0;

        const waterUsage = Math.max(0, wCurr - wPrev);
        const elecUsage = Math.max(0, eCurr - ePrev);

        // ✅ ROUND EACH COST
        const waterCost = round2(waterUsage * propertyRates.waterRate);
        const elecCost = round2(elecUsage * propertyRates.electricityRate);

        const rent =
            Number(unit.effective_rent_amount) ||
            Number(unit.rent_amount) ||
            0;

        const dues = Number(property.assoc_dues) || 0;

        const totalExtraCharges = round2(
            extraExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
        );

        const totalDiscounts = round2(
            discounts.reduce((s, d) => s + (Number(d.amount) || 0), 0)
        );

        const pdcCovered =
            pdc?.status === "cleared"
                ? Math.min(Number(pdc.amount) || 0, rent)
                : 0;

        // ✅ ROUND FINAL TOTAL
        const adjustedTotal = round2(
            rent -
            pdcCovered +
            dues +
            waterCost +
            elecCost +
            totalExtraCharges -
            totalDiscounts
        );

        return {
            rent: round2(rent),
            dues: round2(dues),
            waterUsage,
            elecUsage,
            waterCost,
            elecCost,
            totalExtraCharges,
            totalDiscounts,
            adjustedTotal,
        };
    }, [unit, property, form, extraExpenses, discounts, pdc, propertyRates]);

    /* ------------------ PAYLOAD ------------------ */
    const buildPayload = () => ({
        unit_id: unit.unit_id,
        ...form,
        totalWaterAmount: bill.waterCost,
        totalElectricityAmount: bill.elecCost,
        total_amount_due: bill.adjustedTotal,
        additionalCharges: [
            ...extraExpenses.map((e) => ({
                charge_category: "additional",
                charge_type: e.type,
                amount: e.amount,
            })),
            ...discounts.map((d) => ({
                charge_category: "discount",
                charge_type: d.type,
                amount: d.amount,
            })),
        ],
    });

    const handleMarkCleared = async () => {
        if (!pdc?.pdc_id) return;
        const confirm = await Swal.fire({
            title: "Mark PDC as Cleared?",
            text: "This will mark the check as cleared and apply it against this billing.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, mark cleared",
        });
        if (!confirm.isConfirmed) return;
        try {
            const res = await axios.put(`/api/landlord/pdc/updateStatus`, {
                pdc_id: pdc.pdc_id,
                status: "cleared",
            });
            if (res.status === 200) {
                setPdc((prev: any) => (prev ? { ...prev, status: "cleared" } : prev));
                Swal.fire(
                    "✅ Updated",
                    "PDC has been marked as cleared successfully.",
                    "success"
                );
            } else Swal.fire("Warning", "Unexpected server response.", "warning");
        } catch (error: any) {
            console.error("❌ Error marking PDC cleared:", error);
            Swal.fire(
                "Error",
                error.response?.data?.error || "Failed to update PDC status.",
                "error"
            );
        }
    };

    /* ------------------ CREATE ------------------ */
    const createBilling = async () => {
        await axios.post(
            "/api/landlord/billing/submetered/createUnitMonthlyBilling",
            buildPayload()
        );
    };

    /* ------------------ UPDATE ------------------ */
    const updateBilling = async () => {
        try {
            Swal.fire({
                title: "Updating billing…",
                text: "Please wait while we save the changes.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            await axios.put(
                "/api/landlord/billing/submetered/createUnitMonthlyBilling",
                {
                    ...buildPayload(),
                    billing_id: existingBillingMeta?.billing_id,
                }
            );

            Swal.fire({
                icon: "success",
                title: "Billing Updated",
                text: "The billing statement has been updated successfully.",
                confirmButtonColor: "#10b981", // emerald
            });

            fetchUnitData(); // 🔄 refresh values
        } catch (error: any) {
            console.error("❌ Update billing failed:", error);

            Swal.fire({
                icon: "error",
                title: "Update Failed",
                text:
                    error.response?.data?.error ||
                    "Something went wrong while updating the billing.",
                confirmButtonColor: "#ef4444", // red
            });
        }
    };


    /* ------------------ SUBMIT ------------------ */
    const handleSubmit = async () => {
        try {
            await createBilling();
            Swal.fire("Success", "Billing created successfully", "success");
            fetchUnitData();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to create billing", "error");
        }
    };


    /* ------------------ RETURN ------------------ */
    return {
        unit,
        property,
        propertyRates,
        form,
        setForm,
        extraExpenses,
        discounts,
        bill,
        pdc,
        loadingPdc,
        hasExistingBilling,
        existingBillingMeta,
        isRateModalOpen,
        setIsRateModalOpen,

        startTour,
        handleChange,
        handleAddExpense,
        handleExpenseChange,
        handleRemoveExpense,
        handleAddDiscount,
        handleDiscountChange,
        handleRemoveDiscount,
        handleSubmit,
        updateBilling,
        handleMarkCleared
    };
}
