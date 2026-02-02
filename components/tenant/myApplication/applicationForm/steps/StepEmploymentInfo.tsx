import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { TenantApplicationFormData } from "../types";

import occupations from "@/constant/occupations";
import employmentTypes from "@/constant/employementType";
import monthlyIncomeRanges from "@/constant/monthlyIncome";

interface Props {
    formData: TenantApplicationFormData;
    setFormData: (v: TenantApplicationFormData) => void;
    isMobile: boolean;
}

export default function StepEmploymentInfo({
                                               formData,
                                               setFormData,
                                               isMobile,
                                           }: Props) {
    return (
        <Box display="grid" gap={2} pb={{ xs: 2, sm: 0 }}>
            {/* Occupation */}
            <FormControl fullWidth required>
                <InputLabel>Occupation</InputLabel>
                <Select
                    label="Occupation"
                    value={formData.occupation}
                    onChange={(e) =>
                        setFormData({ ...formData, occupation: e.target.value })
                    }
                    sx={{
                        "& .MuiSelect-select": {
                            fontSize: isMobile ? "16px" : "14px",
                        },
                    }}
                >
                    {occupations.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                            {o.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Employment Type */}
            <FormControl fullWidth required>
                <InputLabel>Employment Type</InputLabel>
                <Select
                    label="Employment Type"
                    value={formData.employment_type}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            employment_type: e.target.value,
                        })
                    }
                    sx={{
                        "& .MuiSelect-select": {
                            fontSize: isMobile ? "16px" : "14px",
                        },
                    }}
                >
                    {employmentTypes.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                            {t.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Monthly Income */}
            <FormControl fullWidth required>
                <InputLabel>Monthly Income</InputLabel>
                <Select
                    label="Monthly Income"
                    value={formData.monthly_income}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            monthly_income: e.target.value,
                        })
                    }
                    sx={{
                        "& .MuiSelect-select": {
                            fontSize: isMobile ? "16px" : "14px",
                        },
                    }}
                >
                    {monthlyIncomeRanges.map((m) => (
                        <MenuItem key={m.value} value={m.value}>
                            {m.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}
