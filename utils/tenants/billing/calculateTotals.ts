import { toNumber } from "@/utils/formatter/formatters";

export function calculateTotals(bill, lateFee = 0) {
    /* ---------------- BASE RENT ---------------- */
    const baseRent = toNumber(bill.breakdown?.base_rent);

    /* ---------------- UTILITIES (FROM BILLING) ---------------- */
    const waterAmt = toNumber(bill.utilities?.water?.total);
    const elecAmt = toNumber(bill.utilities?.electricity?.total);

    /* ---------------- ADVANCE PAYMENT ---------------- */
    const advancePayment = bill.breakdown?.is_advance_payment_paid
        ? toNumber(bill.breakdown.advance_payment_required)
        : 0;

    /* ---------------- ADDITIONAL / DISCOUNTS ---------------- */
    const additionalCharges = (bill.billingAdditionalCharges || []).reduce(
        (sum, c) =>
            c.charge_category === "discount"
                ? sum - toNumber(c.amount)
                : sum + toNumber(c.amount),
        0
    );

    /* ---------------- CLEARED PDC ---------------- */
    const clearedPdcTotal =
        bill.postDatedChecks?.reduce(
            (sum, p) =>
                p.status === "cleared"
                    ? sum + toNumber(p.amount)
                    : sum,
            0
        ) || 0;

    /* ---------------- RENT SUBTOTAL ---------------- */
    const rentSubtotal =
        baseRent +
        additionalCharges -
        advancePayment +
        toNumber(lateFee) -
        clearedPdcTotal;

    /* ---------------- UTILITY SUBTOTAL ---------------- */
    const utilitySubtotal = waterAmt + elecAmt;

    /* ---------------- GRAND TOTAL ---------------- */
    const totalDue = rentSubtotal + utilitySubtotal;

    return {
        baseRent,
        waterAmt,
        elecAmt,
        rentSubtotal,
        utilitySubtotal,
        totalDue,
        additionalCharges,
        advancePayment,
        clearedPdcTotal,
    };
}
