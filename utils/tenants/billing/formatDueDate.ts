import { formatDate } from "@/utils/formatter/formatters";

export function getBillingDueDate(bill) {
    const dueDay = bill?.propertyConfig?.billingDueDay;
    if (!dueDay) return null;

    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);

    return formatDate(dueDate);
}
