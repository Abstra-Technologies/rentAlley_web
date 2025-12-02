import { toNumber } from "@/utils/formatter/formatters";

export function calculateTotals(bill, lateFee) {
    const baseRent = toNumber(bill.breakdown?.base_rent);
    const waterAmt = toNumber(bill.total_water_amount);
    const elecAmt = toNumber(bill.total_electricity_amount);

    const advancePayment = bill.breakdown?.is_advance_payment_paid
        ? toNumber(bill.breakdown.advance_payment_required)
        : 0;

    const additionalCharges = (bill.billingAdditionalCharges || []).reduce(
        (sum, c) =>
            c.charge_category === "discount"
                ? sum - toNumber(c.amount)
                : sum + toNumber(c.amount),
        0
    );

    const clearedPdcTotal =
        bill.postDatedChecks?.reduce(
            (sum, p) => (p.status === "cleared" ? sum + toNumber(p.amount) : sum),
            0
        ) || 0;

    const rentSubtotal =
        baseRent +
        additionalCharges -
        advancePayment +
        lateFee -
        clearedPdcTotal;

    const utilitySubtotal = waterAmt + elecAmt;
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
