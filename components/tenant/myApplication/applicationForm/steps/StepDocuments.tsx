import { Box, Typography } from "@mui/material";
import { FiUploadCloud } from "react-icons/fi";
import React from "react";
import Swal from "sweetalert2";

/* ===== Limits ===== */
const LIMITS_MB = {
    id_image: 5,          // Valid ID (JPEG/PNG)
    income_image: 5,     // Proof (images)
    income_pdf: 5,       // Proof (PDF)
};

const toBytes = (mb: number) => mb * 1024 * 1024;

interface Props {
    validIdFile: File | null;
    incomeFile: File | null;
    validIdRef: React.RefObject<HTMLInputElement>;
    incomeRef: React.RefObject<HTMLInputElement>;
    onFile: (file: File, type: "id" | "income") => void;
}

export default function StepDocuments({
                                          validIdFile,
                                          incomeFile,
                                          validIdRef,
                                          incomeRef,
                                          onFile,
                                      }: Props) {
    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "id" | "income"
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf";

        let maxMB = 0;

        if (type === "id") {
            // Valid ID: images only
            maxMB = LIMITS_MB.id_image;
        } else {
            // Proof of income
            maxMB = isPdf ? LIMITS_MB.income_pdf : LIMITS_MB.income_image;
        }

        if (file.size > toBytes(maxMB)) {
            Swal.fire({
                icon: "error",
                title: "File too large",
                text: `Maximum allowed size is ${maxMB}MB for this file.`,
            });
            e.target.value = ""; // allow reselect
            return;
        }

        onFile(file, type);
    };

    return (
        <Box display="grid" gap={3} pb={{ xs: 2, sm: 0 }}>
            {/* ===== Valid ID ===== */}
            <Box
                p={3}
                border="2px dashed #ccc"
                borderRadius={2}
                textAlign="center"
                sx={{
                    cursor: "pointer",
                    "&:hover": { borderColor: "primary.main", bgcolor: "#f9f9f9" },
                }}
                onClick={() => validIdRef.current?.click()}
            >
                <FiUploadCloud size={28} />
                <Typography variant="body2" mt={1}>
                    Upload or Capture Valid ID (JPEG / PNG)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Max file size: {LIMITS_MB.id_image}MB
                </Typography>

                <input
                    ref={validIdRef}
                    type="file"
                    hidden
                    accept="image/jpeg,image/png"
                    onChange={(e) => handleFileChange(e, "id")}
                />

                {validIdFile && (
                    <Typography variant="caption" display="block" mt={1} color="success.main">
                        ✓ {validIdFile.name}
                    </Typography>
                )}
            </Box>

            {/* ===== Proof of Income ===== */}
            <Box
                p={3}
                border="2px dashed #ccc"
                borderRadius={2}
                textAlign="center"
                sx={{
                    cursor: "pointer",
                    "&:hover": { borderColor: "primary.main", bgcolor: "#f9f9f9" },
                }}
                onClick={() => incomeRef.current?.click()}
            >
                <FiUploadCloud size={28} />
                <Typography variant="body2" mt={1}>
                    Upload Proof of Income (Optional)
                </Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    display={{ xs: "none", sm: "block" }}
                >
                    Images up to {LIMITS_MB.income_image}MB • PDF up to {LIMITS_MB.income_pdf}MB
                </Typography>

                <input
                    ref={incomeRef}
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => handleFileChange(e, "income")}
                />

                {incomeFile && (
                    <Typography variant="caption" display="block" mt={1} color="success.main">
                        ✓ {incomeFile.name}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
