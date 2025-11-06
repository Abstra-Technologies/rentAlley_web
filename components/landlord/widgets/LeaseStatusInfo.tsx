
"use client";
import { Info, FileSignature, Home } from "lucide-react";
import { Box, Typography, Tooltip } from "@mui/material";

export default function LeaseStatusInfo() {
    const leaseStatuses = [
        { label: "Pending", color: "#d97706", desc: "Awaiting signatures." },
        { label: "Active", color: "#16a34a", desc: "Lease is signed and ongoing." },
        { label: "Expired", color: "#dc2626", desc: "Lease has reached its end date." },
    ];

    const signatureStatuses = [
        { label: "Pending", color: "#d97706", desc: "No signatures received yet." },
        { label: "Landlord Signed, Waiting for Tenant", color: "#d97706", desc: "Landlord has signed, awaiting tenant signature." },
        { label: "Complete", color: "#16a34a", desc: "Both landlord and tenant have signed." },
        { label: "Declined", color: "#dc2626", desc: "Tenant has declined the lease." },
    ];

    return (
        <Box
            sx={{
                mt: 2,
                p: { xs: 2, sm: 3 },
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 2, sm: 4 },
                alignItems: { xs: "stretch", sm: "flex-start" },
            }}
        >
            {/* Lease Status Section */}
            <Box sx={{ flex: 1 }}>
                <Box display="flex" alignItems="center" mb={1.5}>
                    <Home size={18} className="text-gray-600 mr-2" />
                    <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                        Lease Status Guide
                    </Typography>
                </Box>
                {leaseStatuses.map((s) => (
                    <Box key={s.label} display="flex" alignItems="center" mb={1}>
                        <Tooltip title={s.desc}>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: s.color,
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    fontSize: { xs: "0.85rem", sm: "0.9rem" },
                                }}
                            >
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: "10px",
                                        height: "10px",
                                        borderRadius: "50%",
                                        backgroundColor: s.color,
                                    }}
                                />
                                <strong>{s.label}</strong>: {s.desc}
                            </Typography>
                        </Tooltip>
                    </Box>
                ))}
            </Box>

            {/* Signature Status Section */}
            <Box sx={{ flex: 1 }}>
                <Box display="flex" alignItems="center" mb={1.5}>
                    <FileSignature size={18} className="text-gray-600 mr-2" />
                    <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                        Signature Status Guide
                    </Typography>
                </Box>
                {signatureStatuses.map((s) => (
                    <Box key={s.label} display="flex" alignItems="center" mb={1}>
                        <Tooltip title={s.desc}>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: s.color,
                                    fontWeight: 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    fontSize: { xs: "0.85rem", sm: "0.9rem" },
                                }}
                            >
                                <span
                                    style={{
                                        display: "inline-block",
                                        width: "10px",
                                        height: "10px",
                                        borderRadius: "50%",
                                        backgroundColor: s.color,
                                    }}
                                />
                                <strong>{s.label}</strong>: {s.desc}
                            </Typography>
                        </Tooltip>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}