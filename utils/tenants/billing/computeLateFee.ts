export function computeLateFee(bill) {
    const config = bill.propertyConfig;
    if (!config || bill.status === "paid") return { lateFee: 0, daysLate: 0 };

    const dueDay = Number(config.billingDueDay || 1);
    const today = new Date();
    const due = new Date(today.getFullYear(), today.getMonth(), dueDay);

    const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
    if (diff <= Number(config.gracePeriodDays || 0))
        return { lateFee: 0, daysLate: 0 };

    const daysLate = diff - Number(config.gracePeriodDays || 0);

    const lateFee =
        config.lateFeeType === "percentage"
            ? (Number(bill.breakdown?.base_rent || 0) *
                Number(config.lateFeeAmount || 0)) /
            100
            : Number(config.lateFeeAmount || 0) * Math.max(daysLate, 1);

    return { lateFee, daysLate };
}
