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

    /* ------------------ STATE ------------------ */
    const today = new Date().toISOString().split("T")[0];

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
        billingDate: today,
        readingDate: today,
        dueDate: "",
        waterPrevReading: "",
        waterCurrentReading: "",
        electricityPrevReading: "",
        electricityCurrentReading: "",
        discountAmount: "",
        otherCharges: "",
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
    }, [unit_id]);

    async function fetchUnitData() {
        try {
            const res = await axios.get(
                `/api/landlord/billing/submetered/getUnitBilling?unit_id=${unit_id}`
            );
            const data = res.data;

            if (!data.unit || !data.property)
                throw new Error("Missing unit or property data.");

            setUnit(data.unit);
            setProperty(data.property);

            const dueDate = data.dueDate
                ? new Date(data.dueDate).toISOString().split("T")[0]
                : "";

            const rateRes = await axios.get(
                `/api/landlord/billing/checkPropertyBillingStats?property_id=${data.property.property_id}`
            );
            const billing = rateRes.data.billingData;

            setPropertyRates({
                waterRate:
                    billing?.water?.total && billing?.water?.consumption
                        ? billing.water.total / billing.water.consumption
                        : 0,
                electricityRate:
                    billing?.electricity?.total && billing?.electricity?.consumption
                        ? billing.electricity.total / billing.electricity.consumption
                        : 0,
            });

            const eb = data.existingBilling;

            setForm((prev) => ({
                ...prev,
                readingDate: eb?.reading_date
                    ? new Date(eb.reading_date).toISOString().split("T")[0]
                    : today,
                dueDate: eb?.due_date
                    ? new Date(eb.due_date).toISOString().split("T")[0]
                    : dueDate,
                waterPrevReading: eb?.water_prev ?? "",
                waterCurrentReading: eb?.water_curr ?? "",
                electricityPrevReading: eb?.elec_prev ?? "",
                electricityCurrentReading: eb?.elec_curr ?? "",
            }));

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

            const meta = {
                billing_id: eb?.billing_id,
                lease_id: eb?.lease_id,
            };

            setExistingBillingMeta(meta);
            setHasExistingBilling(!!eb?.billing_id);

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

    async function fetchPDC(billingId?: number, leaseId?: number) {
        try {
            setLoadingPdc(true);
            const res = billingId
                ? await axios.get(`/api/landlord/pdc/getByBilling?billing_id=${billingId}`)
                : await axios.get(`/api/landlord/pdc/getByLease?lease_id=${leaseId}`);

            const pdc =
                res.data?.pdcs?.find((p: any) => p.status === "pending") ||
                res.data?.pdcs?.find((p: any) => p.status === "cleared") ||
                res.data?.pdcs?.[0] ||
                null;

            setPdc(pdc);
        } finally {
            setLoadingPdc(false);
        }
    }

    /* ------------------ HANDLERS ------------------ */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleAddExpense = () =>
        setExtraExpenses((p) => [...p, { type: "", amount: 0 }]);

    const handleExpenseChange = (idx: number, field: string, value: any) => {
        const updated = [...extraExpenses];
        updated[idx][field] =
            field === "amount" ? parseFloat(value) || 0 : value;
        setExtraExpenses(updated);
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
        const updated = [...discounts];
        updated[idx][field] =
            field === "amount" ? parseFloat(value) || 0 : value;
        setDiscounts(updated);
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
        if (!unit || !property)
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

        const wPrev = +form.waterPrevReading || 0;
        const wCurr = +form.waterCurrentReading || 0;
        const ePrev = +form.electricityPrevReading || 0;
        const eCurr = +form.electricityCurrentReading || 0;

        const waterUsage = Math.max(0, wCurr - wPrev);
        const elecUsage = Math.max(0, eCurr - ePrev);

        const waterCost = waterUsage * propertyRates.waterRate;
        const elecCost = elecUsage * propertyRates.electricityRate;

        const rent = +unit?.effective_rent_amount || +unit?.rent_amount || 0;
        const dues = +property?.assoc_dues || 0;

        const extra = extraExpenses.reduce((s, e) => s + (+e.amount || 0), 0);
        const discount = discounts.reduce((s, d) => s + (+d.amount || 0), 0);

        const pdcCovered =
            pdc?.status === "cleared" ? Math.min(+pdc.amount || 0, rent) : 0;

        return {
            rent,
            dues,
            waterUsage,
            elecUsage,
            waterCost,
            elecCost,
            totalExtraCharges: extra,
            totalDiscounts: discount,
            adjustedTotal:
                rent - pdcCovered + dues + waterCost + elecCost + extra - discount,
        };
    }, [unit, property, form, extraExpenses, discounts, pdc, propertyRates]);

    /* ------------------ SUBMIT ------------------ */
    const handleSubmit = async () => {
        try {
            const payload = {
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
            };

            const method = hasExistingBilling ? "put" : "post";
            await axios({
                method,
                url: "/api/landlord/billing/submetered/createUnitMonthlyBilling",
                data: payload,
            });

            Swal.fire("Success", "Billing saved successfully", "success");
            fetchUnitData();
        } catch {
            Swal.fire("Error", "Failed to save billing", "error");
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
    };
}
