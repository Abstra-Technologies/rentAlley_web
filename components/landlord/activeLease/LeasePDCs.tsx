"use client";

import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Chip,
    Tooltip,
    IconButton,
    Modal,
    Divider,
} from "@mui/material";
import {
    Calendar,
    CheckCircle2,
    RefreshCcw,
    XCircle,
    FileDown,
    Eye,
} from "lucide-react";
import Swal from "sweetalert2";

interface PDC {
    pdc_id: number;
    check_number: string;
    bank_name: string;
    amount: number | string;
    due_date: string;
    status: "pending" | "cleared" | "bounced" | "replaced";
    uploaded_image_url?: string;
}

interface LeasePDCsProps {
    lease: {
        lease_id?: string;
        pdcs?: PDC[];
    };
}

export default function LeasePDCs({ lease }: LeasePDCsProps) {
    const [refreshing, setRefreshing] = useState(false);
    const [pdcList, setPdcList] = useState<PDC[]>(lease?.pdcs || []);
    const [selectedPDC, setSelectedPDC] = useState<PDC | null>(null);

    useEffect(() => {
        if (lease?.pdcs) setPdcList(lease.pdcs);
    }, [lease]);

    // 🔁 Refresh Function
    const handleRefresh = async () => {
        if (!lease?.lease_id) return;
        setRefreshing(true);
        try {
            const res = await fetch(`/api/leaseAgreement/getDetailedLeaseInfo/${lease.lease_id}`);
            const data = await res.json();
            if (res.ok && data.pdcs) {
                setPdcList(data.pdcs);
                Swal.fire({
                    icon: "success",
                    title: "Refreshed",
                    text: "PDC list updated successfully.",
                    timer: 1200,
                    showConfirmButton: false,
                });
            } else {
                Swal.fire("Error", "Failed to refresh PDC list.", "error");
            }
        } catch (err) {
            console.error("Refresh failed:", err);
            Swal.fire("Error", "Failed to refresh PDC list.", "error");
        } finally {
            setRefreshing(false);
        }
    };

    const handleUpdateStatus = async (pdc_id: number, newStatus: string) => {
        if (!lease?.lease_id) return;

        const confirm = await Swal.fire({
            title: `Mark as ${newStatus}?`,
            text: `Are you sure you want to set this check's status to ${newStatus.toUpperCase()}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: `Yes, mark as ${newStatus}`,
        });

        if (!confirm.isConfirmed) return;

        try {
            const res = await fetch(`/api/landlord/pdc/updateStatus`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pdc_id, status: newStatus }),
            });

            if (!res.ok) throw new Error("Failed to update PDC status");

            setPdcList((prev) =>
                prev.map((pdc) =>
                    pdc.pdc_id === pdc_id ? { ...pdc, status: newStatus as any } : pdc
                )
            );

            Swal.fire({
                icon: "success",
                title: "Updated",
                text: `PDC marked as ${newStatus}.`,
                timer: 1200,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error("Error updating PDC:", err);
            Swal.fire("Error", "Could not update PDC status.", "error");
        }
    };

    // 👁️ View Modal
    const [openModal, setOpenModal] = useState(false);
    const handleView = (pdc: PDC) => {
        setSelectedPDC(pdc);
        setOpenModal(true);
    };
    const handleCloseModal = () => setOpenModal(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "cleared":
                return "success";
            case "pending":
                return "warning";
            case "bounced":
                return "error";
            case "replaced":
                return "info";
            default:
                return "default";
        }
    };

    if (!pdcList || pdcList.length === 0) {
        return (
            <Box className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
                <Typography variant="h6" className="text-gray-700 mb-2">
                    No Post-Dated Checks Found
                </Typography>
                <Typography className="text-gray-500 text-sm">
                    There are currently no PDC records for this lease agreement.
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <Box className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center flex-wrap gap-3">
                    <div>
                        <Typography variant="h6" className="text-gray-800 font-semibold">
                            Post-Dated Checks
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
                            Manage and track all issued checks related to this lease.
                        </Typography>
                    </div>

                    <Tooltip title="Refresh PDC list">
                        <IconButton onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCcw
                                className={`w-5 h-5 text-blue-600 transition-transform ${
                                    refreshing ? "animate-spin" : ""
                                }`}
                            />
                        </IconButton>
                    </Tooltip>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left border-t">
                        <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                        <tr>
                            <th className="py-3 px-4">Check #</th>
                            <th className="py-3 px-4">Bank</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4">Due Date</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pdcList.map((pdc) => (
                            <tr
                                key={pdc.pdc_id}
                                className="border-b hover:bg-blue-50 transition-all duration-200"
                            >
                                <td className="py-3 px-4 font-medium text-gray-800">
                                    {pdc.check_number}
                                </td>
                                <td className="py-3 px-4 text-gray-700">{pdc.bank_name}</td>
                                <td className="py-3 px-4 text-gray-800 font-semibold">
                                    ₱
                                    {Number(pdc.amount).toLocaleString("en-PH", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </td>
                                <td className="py-3 px-4 flex items-center gap-2 text-gray-700">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    {new Date(pdc.due_date).toLocaleDateString("en-PH", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </td>
                                <td className="py-3 px-4">
                                    <Chip
                                        label={pdc.status}
                                        color={getStatusColor(pdc.status)}
                                        size="small"
                                        className="capitalize font-medium"
                                    />
                                </td>
                                <td className="py-3 px-4 flex justify-center gap-2">
                                    {pdc.status === "pending" && (
                                        <>
                                            <Tooltip title="Mark as Cleared">
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() =>
                                                        handleUpdateStatus(pdc.pdc_id, "cleared")
                                                    }
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Mark as Bounced">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() =>
                                                        handleUpdateStatus(pdc.pdc_id, "bounced")
                                                    }
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                    <Tooltip title="View Check">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleView(pdc)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Download Copy">
                                        <IconButton size="small" color="primary">
                                            <FileDown className="w-4 h-4" />
                                        </IconButton>
                                    </Tooltip>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Box>

            {/* 👁️ View Modal */}
            <Modal open={openModal} onClose={handleCloseModal}>
                <Box
                    className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 mx-auto mt-20 max-w-lg space-y-4"
                >
                    {selectedPDC && (
                        <>
                            <Typography variant="h6" className="font-bold text-gray-800">
                                Check #{selectedPDC.check_number}
                            </Typography>
                            <Divider />
                            <Typography className="text-gray-700">
                                <b>Bank:</b> {selectedPDC.bank_name}
                            </Typography>
                            <Typography className="text-gray-700">
                                <b>Amount:</b> ₱
                                {Number(selectedPDC.amount).toLocaleString("en-PH", {
                                    minimumFractionDigits: 2,
                                })}
                            </Typography>
                            <Typography className="text-gray-700">
                                <b>Due Date:</b>{" "}
                                {new Date(selectedPDC.due_date).toLocaleDateString("en-PH", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </Typography>
                            <Typography className="text-gray-700 capitalize">
                                <b>Status:</b> {selectedPDC.status}
                            </Typography>

                            {selectedPDC.uploaded_image_url ? (
                                <div className="mt-3">
                                    <img
                                        src={selectedPDC.uploaded_image_url}
                                        alt="Check"
                                        className="w-full max-h-80 object-contain rounded-lg border border-gray-200 shadow-sm"
                                    />
                                </div>
                            ) : (
                                <Typography className="text-gray-500 italic">
                                    No image available for this check.
                                </Typography>
                            )}
                        </>
                    )}
                </Box>
            </Modal>
        </>
    );
}
