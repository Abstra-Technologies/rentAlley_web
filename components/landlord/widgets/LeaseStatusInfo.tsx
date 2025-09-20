
"use client";
import { Info } from "lucide-react"; // or any icon
import { Box, Typography, Tooltip } from "@mui/material";

export default function LeaseStatusInfo() {
    const statuses = [
        { label: "Pending", color: "orange", desc: "Awaiting signatures." },
        { label: "Active", color: "green", desc: "Lease is signed and ongoing." },
        { label: "Expired", color: "red", desc: "Lease has reached its end date." },
    ];

    return (
        <Box
            sx={{
                mt: 2,
                p: 2,
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
            }}
        >
            <Box display="flex" alignItems="center" mb={1}>
                <Info size={18} className="text-gray-600 mr-2" />
                <Typography variant="subtitle2" fontWeight="bold">
                    Lease Status Guide
                </Typography>
            </Box>

            {statuses.map((s) => (
                <Typography
                    key={s.label}
                    variant="body2"
                    sx={{ mb: 0.5, color: s.color }}
                >
                    <strong>{s.label}:</strong> {s.desc}
                </Typography>
            ))}
        </Box>
    );
}
