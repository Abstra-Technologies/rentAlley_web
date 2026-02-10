"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";
import { BackButton } from "@/components/navigation/backButton";
import {
    Wallet,
    Eye,
    EyeOff,
    Pencil,
    Trash2,
    Shield,
} from "lucide-react";

/* =====================
   HELPERS
===================== */
const maskNumber = (value: string) => {
    if (!value) return "";
    if (value.length <= 4) return value;
    return "•".repeat(value.length - 4) + value.slice(-4);
};

const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
};

const normalizeText = (val?: string) =>
    typeof val === "string" && val.trim() !== "" && val !== "0"
        ? val
        : undefined;

/* =====================
   PAGE
===================== */
export default function PayoutDetails() {
    const { user, fetchSession } = useAuthStore();
    const landlord_id = user?.landlord_id;

    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<any[]>([]);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const [editForm, setEditForm] = useState({
        account_name: "",
        account_number: "",
    });

    const [visibleNumbers, setVisibleNumbers] = useState<Record<number, boolean>>(
        {},
    );

    /* =====================
       LOAD DATA
    ===================== */
    useEffect(() => {
        if (!user) fetchSession();
        if (!user?.landlord_id) return;

        async function loadAccounts() {
            const res = await axios.get("/api/landlord/payout/getAllAccount", {
                params: { landlord_id },
            });

            const normalized =
                res.data.accounts?.map((a: any) => ({
                    ...a,
                    bank_name: normalizeText(a.bank_name),
                    account_name: normalizeText(a.account_name),
                })) || [];

            setAccounts(normalized);
            setLoading(false);
        }

        loadAccounts();
    }, [user]);

    const activeAccount = useMemo(
        () => accounts.find((a) => a.is_active === 1),
        [accounts],
    );

    const otherAccounts = useMemo(
        () => accounts.filter((a) => a.is_active === 0),
        [accounts],
    );

    /* =====================
       SET ACTIVE
    ===================== */
    const setActive = async (payout_id: number) => {
        await axios.post("/api/landlord/payout/setActive", {
            landlord_id,
            payout_id,
        });

        setAccounts((prev) =>
            prev.map((a) => ({
                ...a,
                is_active: a.payout_id === payout_id ? 1 : 0,
            })),
        );
    };

    /* =====================
       EDIT
    ===================== */
    const startEdit = (acc: any) => {
        setEditingId(acc.payout_id);
        setEditForm({
            account_name: acc.account_name || "",
            account_number: acc.account_number || "",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ account_name: "", account_number: "" });
    };

    const saveEdit = async (payout_id: number) => {
        if (!editForm.account_name || !editForm.account_number) {
            Swal.fire("Missing fields", "Complete all required fields", "warning");
            return;
        }

        setSaving(true);

        try {
            await axios.put("/api/landlord/payout/updateAccount", {
                payout_id,
                account_name: editForm.account_name,
                account_number: editForm.account_number,
                landlord_id:user?.landlord_id
            });

            setAccounts((prev) =>
                prev.map((a) =>
                    a.payout_id === payout_id
                        ? {
                            ...a,
                            account_name: editForm.account_name,
                            account_number: editForm.account_number,
                        }
                        : a,
                ),
            );

            Swal.fire("Updated", "Payout account updated", "success");
            cancelEdit();
        } finally {
            setSaving(false);
        }
    };

    /* =====================
       DELETE
    ===================== */
    const handleDelete = async (acc: any) => {
        if (acc.is_active) {
            Swal.fire(
                "Not allowed",
                "You cannot delete the active payout account",
                "warning",
            );
            return;
        }

        const confirm = await Swal.fire({
            title: "Delete payout account?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
        });

        if (!confirm.isConfirmed) return;

        await axios.delete("/api/landlord/payout/deleteAccount", {
            data: { payout_id: acc.payout_id, landlord_id: user?.landlord_id },
        });

        setAccounts((prev) => prev.filter((a) => a.payout_id !== acc.payout_id));
    };

    if (loading) return null;

    /* =====================
       CARD
    ===================== */
    const renderCard = (acc: any) => {
        const isEditing = editingId === acc.payout_id;
        const showNumber = visibleNumbers[acc.payout_id];
        const isActive = acc.is_active === 1;

        return (
            <motion.div
                key={acc.payout_id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -4, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className={`relative overflow-hidden rounded-2xl p-4 space-y-2 group ${
                    isActive
                        ? "bg-gradient-to-br from-blue-600 to-emerald-600 text-white shadow-xl"
                        : "bg-white border border-gray-200 hover:shadow-lg"
                }`}
            >
                {isActive && (
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 via-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}

                {/* HEADER */}
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        {acc.bank_name && (
                            <p className="font-semibold">{acc.bank_name}</p>
                        )}

                        {isActive && (
                            <span className="inline-block mt-0.5 text-[10px] font-bold tracking-wide text-white/90">
                                ACTIVE PAYOUT
                            </span>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => startEdit(acc)}
                                className="p-1 rounded-lg hover:bg-black/10"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>

                            {!isActive && (
                                <button
                                    onClick={() => handleDelete(acc)}
                                    className="p-1 rounded-lg hover:bg-red-100"
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* CONTENT */}
                {isEditing ? (
                    <>
                        <input
                            className="w-full border rounded-xl px-3 py-2 text-sm text-gray-900"
                            value={editForm.account_name}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    account_name: e.target.value,
                                })
                            }
                        />

                        <input
                            className="w-full border rounded-xl px-3 py-2 text-sm font-mono text-gray-900"
                            value={editForm.account_number}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    account_number: e.target.value,
                                })
                            }
                        />

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => saveEdit(acc.payout_id)}
                                disabled={saving}
                                className="flex-1 py-2 rounded-xl bg-black/80 text-white text-sm"
                            >
                                Save
                            </button>

                            <button
                                onClick={cancelEdit}
                                className="flex-1 py-2 rounded-xl border text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {acc.account_name && (
                            <p
                                className={`text-sm ${
                                    isActive
                                        ? "text-white/90"
                                        : "text-gray-700"
                                }`}
                            >
                                {acc.account_name}
                            </p>
                        )}

                        <div className="flex items-center justify-between">
                            <p
                                className={`text-sm font-mono ${
                                    isActive
                                        ? "text-white"
                                        : "text-gray-800"
                                }`}
                            >
                                {showNumber
                                    ? acc.account_number
                                    : maskNumber(acc.account_number)}
                            </p>

                            <button
                                onClick={() =>
                                    setVisibleNumbers((v) => ({
                                        ...v,
                                        [acc.payout_id]: !v[acc.payout_id],
                                    }))
                                }
                                className="p-1 rounded-lg hover:bg-black/10"
                            >
                                {showNumber ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>

                        {!isActive && (
                            <button
                                onClick={() => setActive(acc.payout_id)}
                                className="w-full mt-2 py-2 rounded-xl bg-blue-600 text-white text-sm"
                            >
                                Set Active
                            </button>
                        )}
                    </>
                )}
            </motion.div>
        );
    };

    /* =====================
       RENDER
    ===================== */
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b px-4 py-4">
                <BackButton label="Back" />
                <div className="mt-3 flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <Wallet className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Payout Accounts</h1>
                        <p className="text-xs text-gray-500">
                            Manage and switch payout destinations
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 py-6 space-y-4 max-w-xl mx-auto">
                {activeAccount && renderCard(activeAccount)}
                {otherAccounts.map(renderCard)}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mt-4">
                    <Shield className="w-5 h-5 text-amber-600" />
                    <p className="text-xs text-amber-700">
                        Your payout information is encrypted and securely stored.
                    </p>
                </div>
            </div>
        </div>
    );
}
