import { Box, TextField } from "@mui/material";
import { TenantApplicationFormData } from "../types";

interface Props {
    formData: TenantApplicationFormData;
    setFormData: (v: TenantApplicationFormData) => void;
    isMobile: boolean;
}

export default function StepBasicInfo({
                                          formData,
                                          setFormData,
                                          isMobile,
                                      }: Props) {
    return (
        <Box display="grid" gap={2} pb={{ xs: 2, sm: 0 }}>
            {/* First Name */}
            <TextField
                label="First Name"
                value={formData.firstName}
                onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                }
                fullWidth
                required
                inputProps={{
                    style: { fontSize: isMobile ? "16px" : "14px" },
                }}
            />

            {/* Last Name */}
            <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                }
                fullWidth
                required
                inputProps={{
                    style: { fontSize: isMobile ? "16px" : "14px" },
                }}
            />

            {/* Birth Date */}
            <TextField
                label="Birth Date"
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                    setFormData({ ...formData, birthDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{
                    max: new Date().toISOString().split("T")[0],
                    style: { fontSize: isMobile ? "16px" : "14px" }, // prevents iOS zoom
                }}
                helperText="You must be 18 years or older"
                fullWidth
                required
            />

            {/* Mobile Number */}
            <TextField
                label="Mobile Number"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d{0,12}$/.test(value)) {
                        setFormData({ ...formData, phoneNumber: value });
                    }
                }}
                inputProps={{
                    maxLength: 12,
                    minLength: 11,
                    style: { fontSize: isMobile ? "16px" : "14px" },
                }}
                placeholder="09XXXXXXXXX"
                fullWidth
                required
            />

            {/* Email (Read-only) */}
            <TextField
                label="Email"
                type="email"
                value={formData.email}
                InputProps={{ readOnly: true }}
                helperText="Email is taken from your account"
                fullWidth
            />

            {/* Address */}
            <TextField
                label="Address"
                value={formData.address}
                onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                }
                multiline
                minRows={2}
                inputProps={{
                    style: { fontSize: isMobile ? "16px" : "14px" },
                }}
                fullWidth
                required
            />
        </Box>
    );
}
