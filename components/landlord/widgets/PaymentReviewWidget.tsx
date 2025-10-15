"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
} from "@mui/material";
import useAuthStore from "@/zustand/authStore";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/utils/formatter/formatters";

type Payment = {
    payment_id: number;
    tenant_name: string;
    property_name: string;
    amount_paid: number;
    payment_date: string;
    proof_of_payment: string;
    payment_status: "pending" | "confirmed" | "failed";
};

export default function PaymentReviewWidget() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const { user } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!user?.landlord_id) return;

        fetch(
            `/api/landlord/payments/getListofPaymentforReview?landlord_id=${user.landlord_id}`
        )
            .then((res) => res.json())
            .then((data) => {
                setPayments(data || []);
            })
            .catch((err) => console.error("Failed to fetch payments", err));
    }, [user?.landlord_id]);

    const handleAction = async (id: number, action: "approve" | "reject") => {
        try {
            await fetch(`/api/landlord/payments/${id}/${action}`, { method: "POST" });

            setPayments((prev) =>
                prev.map((p) =>
                    p.payment_id === id
                        ? {
                            ...p,
                            payment_status: action === "approve" ? "confirmed" : "failed",
                        }
                        : p
                )
            );
        } catch (err) {
            console.error("Action failed:", err);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">

                {payments.length > 5 && (
                    <button
                        onClick={() => router.push("/pages/landlord/payments/review")}
                        className="text-sm font-medium text-blue-600 hover:text-emerald-600 transition-all duration-200"
                    >
                        View All →
                    </button>
                )}
            </div>

            {/* Payment Table */}
            <TableContainer
                component={Paper}
                sx={{
                    boxShadow: "none",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                }}
            >
                <Table size="small">
                    <TableHead sx={{ backgroundColor: "#f9fafb" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "600", color: "#374151" }}>
                                Tenant
                            </TableCell>
                            <TableCell sx={{ fontWeight: "600", color: "#374151" }}>
                                Amount
                            </TableCell>
                            <TableCell sx={{ fontWeight: "600", color: "#374151" }}>
                                Proof
                            </TableCell>
                            <TableCell sx={{ fontWeight: "600", color: "#374151" }}>
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                    <p className="text-gray-500 text-sm">
                                        No pending payments to review.
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.slice(0, 5).map((payment) => (
                                <TableRow
                                    key={payment.payment_id}
                                    hover
                                    sx={{
                                        "&:hover": { backgroundColor: "#f9fafb" },
                                        transition: "background-color 0.2s",
                                    }}
                                >
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {payment.tenant_name || "Unknown Tenant"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {payment.property_name}
                                            </p>
                                        </div>
                                    </TableCell>

                                    <TableCell>
                    <span className="font-semibold text-emerald-700">
                      {formatCurrency(payment.amount_paid)}
                    </span>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(payment.payment_date)}
                                        </p>
                                    </TableCell>

                                    <TableCell>
                                        {payment.proof_of_payment ? (
                                            <a
                                                href={payment.proof_of_payment}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <img
                                                    src={payment.proof_of_payment}
                                                    alt="Proof"
                                                    className="h-10 w-10 rounded-lg object-cover border border-gray-200 hover:opacity-90 transition"
                                                />
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-xs italic">
                        No proof
                      </span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="contained"
                                                color="success"
                                                size="small"
                                                sx={{
                                                    textTransform: "none",
                                                    px: 1.5,
                                                    borderRadius: "8px",
                                                }}
                                                onClick={() =>
                                                    handleAction(payment.payment_id, "approve")
                                                }
                                                disabled={payment.payment_status !== "pending"}
                                            >
                                                ✓ Approve
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                size="small"
                                                sx={{
                                                    textTransform: "none",
                                                    px: 1.5,
                                                    borderRadius: "8px",
                                                }}
                                                onClick={() =>
                                                    handleAction(payment.payment_id, "reject")
                                                }
                                                disabled={payment.payment_status !== "pending"}
                                            >
                                                ✗ Reject
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Footer "View All" link */}
            {payments.length > 5 && (
                <div className="text-right mt-2">
                    <button
                        onClick={() => router.push("/pages/landlord/payments/review")}
                        className="text-sm text-blue-600 hover:text-emerald-600 font-medium transition-all"
                    >
                        View All Payments →
                    </button>
                </div>
            )}
        </div>
    );
}
