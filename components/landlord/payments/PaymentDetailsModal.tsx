"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, BadgeCheck, Clock, XCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatter/formatters";

interface Props {
    open: boolean;
    onClose: () => void;
    payment: any | null;
}

export default function PaymentDetailsModal({
                                                open,
                                                onClose,
                                                payment,
                                            }: Props) {
    if (!payment) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden"
                    >
                        {/* ================= HEADER ================= */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-bold text-gray-900">
                                Payment Details
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-gray-100 transition"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* ================= CONTENT ================= */}
                        <div className="px-6 py-5 space-y-6 text-sm">
                            {/* PAYMENT SECTION */}
                            <Section title="Payment Information">
                                <Detail label="Payment ID" value={payment.payment_id} />
                                <Detail
                                    label="Payment Type"
                                    value={payment.payment_type.replaceAll("_", " ")}
                                    capitalize
                                />
                                <Detail
                                    label="Amount Paid"
                                    value={formatCurrency(payment.amount_paid)}
                                    highlight
                                />
                                <Detail label="Payment Method" value={payment.payment_method_id} />
                                <Detail
                                    label="Payment Status"
                                    value={payment.payment_status}
                                    badge
                                />
                                <Detail
                                    label="Payout Status"
                                    value={payment.payout_status}
                                    payout
                                />
                                <Detail
                                    label="Payment Date"
                                    value={new Date(payment.payment_date).toLocaleString()}
                                />
                                {payment.receipt_reference && (
                                    <Detail
                                        label="Receipt Reference"
                                        value={payment.receipt_reference}
                                    />
                                )}
                            </Section>

                            {/* BILLING SECTION */}
                            {payment.bill_id && (
                                <Section title="Billing Information">
                                    <Detail label="Billing ID" value={payment.bill_id} />
                                    <Detail
                                        label="Billing Period"
                                        value={new Date(payment.billing_period).toLocaleDateString(
                                            "en-US",
                                            { month: "long", year: "numeric" },
                                        )}
                                    />
                                    <Detail
                                        label="Water Charges"
                                        value={formatCurrency(payment.total_water_amount)}
                                    />
                                    <Detail
                                        label="Electricity Charges"
                                        value={formatCurrency(payment.total_electricity_amount)}
                                    />
                                    <Detail
                                        label="Total Amount Due"
                                        value={formatCurrency(payment.total_amount_due)}
                                    />
                                    <Detail
                                        label="Billing Status"
                                        value={payment.billing_status}
                                        badge
                                    />
                                    <Detail
                                        label="Due Date"
                                        value={new Date(payment.due_date).toLocaleDateString()}
                                    />
                                    {payment.paid_at && (
                                        <Detail
                                            label="Paid At"
                                            value={new Date(payment.paid_at).toLocaleString()}
                                        />
                                    )}
                                </Section>
                            )}

                            {/* AGREEMENT / UNIT */}
                            <Section title="Lease & Unit">
                                <Detail label="Lease ID" value={payment.agreement_id} />
                                <Detail label="Unit ID" value={payment.unit_id} />
                            </Section>
                        </div>

                        {/* ================= FOOTER ================= */}
                        <div className="px-6 py-4 border-t flex justify-end gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-semibold rounded-xl
                           bg-gray-100 hover:bg-gray-200 transition"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* =======================
    HELPERS
======================= */

function Section({
                     title,
                     children,
                 }: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <h4 className="font-bold text-gray-800 mb-3">{title}</h4>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function Detail({
                    label,
                    value,
                    highlight,
                    capitalize,
                    badge,
                    payout,
                }: {
    label: string;
    value: string | number;
    highlight?: boolean;
    capitalize?: boolean;
    badge?: boolean;
    payout?: boolean;
}) {
    const badgeStyle = badge
        ? {
            confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
            pending: "bg-amber-100 text-amber-700 border-amber-200",
            failed: "bg-red-100 text-red-700 border-red-200",
            cancelled: "bg-gray-100 text-gray-600 border-gray-200",
            unpaid: "bg-gray-100 text-gray-600 border-gray-200",
            in_payout: "bg-blue-100 text-blue-700 border-blue-200",
            paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
        }[(value as string) || ""] ||
        "bg-gray-100 text-gray-700 border-gray-200"
        : "";

    return (
        <div className="flex justify-between gap-4">
            <span className="text-gray-500">{label}</span>

            {badge || payout ? (
                <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${badgeStyle}`}
                >
          {String(value).replaceAll("_", " ")}
        </span>
            ) : (
                <span
                    className={`font-semibold text-right ${
                        highlight ? "text-emerald-600 text-base" : "text-gray-900"
                    } ${capitalize ? "capitalize" : ""}`}
                >
          {value}
        </span>
            )}
        </div>
    );
}
