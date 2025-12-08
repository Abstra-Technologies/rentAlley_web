"use client";
import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import useAuth from "../../../../../hooks/useSession";
import Swal from "sweetalert2";
import LoadingScreen from "@/components/loadingScreen";

import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Stepper,
  Step,
  StepLabel,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FiUploadCloud } from "react-icons/fi";

import occupations from "../../../../../constant/occupations";
import employmentTypes from "../../../../../constant/employementType";
import monthlyIncomeRanges from "../../../../../constant/monthlyIncome";

const steps = ["Basic Info", "Employment Info", "Documentary Requirements"];

const TenantApplicationForm = () => {
  const { unit_id } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState({
    unit_id: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    phoneNumber: "",
    email: "",
    address: "",
    occupation: "",
    employment_type: "",
    monthly_income: "",
  });

  const [validIdFile, setValidIdFile] = useState(null);
  const [incomeFile, setIncomeFile] = useState(null);
  const validIdRef = useRef(null);
  const incomeRef = useRef(null);

  useEffect(() => {
    if (!user?.user_id || !user?.tenant_id) return;

    const fetchTenantData = async () => {
      try {
        const res = await axios.get(`/api/tenant/profile`, {
          params: { tenant_id: user.tenant_id },
        });
        const t = res.data.tenant;
        if (t) {
          setFormData((prev) => ({
            ...prev,
            occupation: t.occupation || "",
            employment_type: t.employment_type || "",
            monthly_income: t.monthly_income || "",
          }));
        }
      } catch (err) {
        console.error("Error fetching tenant profile:", err);
      }
    };

    fetchTenantData();
  }, [user]);

  useEffect(() => {
    if (!unit_id) return;
    axios
      .get(`/api/propertyListing/getPropertyDetailByUnitId`, {
        params: { unit_id },
      })
      .then((res) => setPropertyDetails(res.data.propertyDetails))
      .catch((err) => console.error("Fetch error:", err.message));
  }, [unit_id]);

  useEffect(() => {
    if (!user || !unit_id) return;
    axios
      .get(`/api/tenant/applications/alreadyApplied`, {
        params: { tenant_id: user?.tenant_id, unit_id },
      })
      .then((res) => {
        if (res.data.hasApplied) setHasApplied(true);
      })
      .finally(() => setLoading(false));
  }, [user, unit_id]);

  useEffect(() => {
    if (unit_id) {
      setFormData((prev) => ({
        ...prev,
        unit_id,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        birthDate: user?.birthDate || "",
        phoneNumber: user?.phoneNumber || "",
        email: user?.email || "",
        address: user?.address || "",
      }));
    }
  }, [unit_id, user]);

  const handleFileSelect = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      Swal.fire("Error", "File size exceeds 15MB!", "error");
      return;
    }
    if (type === "id") setValidIdFile(file);
    if (type === "income") setIncomeFile(file);
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName) {
      Swal.fire({
        icon: "error",
        title: "Missing Information",
        text: "Please enter your first and last name.",
      });
      return false;
    }

    if (!formData.birthDate) {
      Swal.fire({
        icon: "error",
        title: "Missing Birth Date",
        text: "Please select your birth date.",
      });
      return false;
    }

    // Check age requirement
    const selectedDate = new Date(formData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - selectedDate.getFullYear();
    const monthDiff = today.getMonth() - selectedDate.getMonth();
    const dayDiff = today.getDate() - selectedDate.getDate();

    if (
      age < 18 ||
      (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))
    ) {
      Swal.fire({
        icon: "warning",
        title: "Age Requirement",
        text: "You must be 18 years or older to apply.",
      });
      return false;
    }

    if (!formData.phoneNumber || formData.phoneNumber.length < 11) {
      Swal.fire({
        icon: "error",
        title: "Invalid Phone Number",
        text: "Please enter a valid phone number (at least 11 digits).",
      });
      return false;
    }

    if (!formData.address) {
      Swal.fire({
        icon: "error",
        title: "Missing Address",
        text: "Please enter your address.",
      });
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (activeStep === 0) {
      if (!validateStep1()) {
        return;
      }
    }
    setActiveStep((s) => s + 1);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!user?.user_id || !user?.tenant_id)
      return Swal.fire("Error", "Please log in.", "error");
    if (!validIdFile)
      return Swal.fire("Error", "Please upload a valid ID.", "error");
    if (
      !formData.address ||
      !formData.occupation ||
      !formData.employment_type ||
      !formData.monthly_income
    ) {
      return Swal.fire("Error", "All fields are required.", "error");
    }

    const confirm = await Swal.fire({
      title: "Confirm submission?",
      text: "Do you want to submit your application?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Submit",
    });
    if (!confirm.isConfirmed) return;

    setIsSubmitting(true);
    Swal.fire({
      title: "Submitting...",
      text: "Please wait while we process your application.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const fd = new FormData();
      fd.append("user_id", user.user_id);
      fd.append("tenant_id", user.tenant_id);
      fd.append("unit_id", formData.unit_id);
      fd.append("address", formData.address);
      fd.append("occupation", formData.occupation);
      fd.append("employment_type", formData.employment_type);
      fd.append("monthly_income", formData.monthly_income);
      fd.append("birthDate", formData.birthDate);
      fd.append("phoneNumber", formData.phoneNumber);

      if (validIdFile) fd.append("valid_id", validIdFile);
      if (incomeFile) fd.append("income_proof", incomeFile);

      await axios.post("/api/tenant/applications/submitApplication", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.close();
      await Swal.fire({
        title: "Success!",
        text: "Your application has been submitted successfully.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      router.push("/pages/tenant/prospective/success");
    } catch (err) {
      Swal.close();
      Swal.fire("Error", err.message || "Submission failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || loading) {
    return <LoadingScreen message="Preparing your form..." />;
  }

  if (hasApplied) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="70vh"
        px={2}
      >
        <Box
          maxWidth="sm"
          width="100%"
          textAlign="center"
          p={4}
          borderRadius={3}
          boxShadow={3}
          bgcolor="background.paper"
        >
          <Box mb={2}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="56"
              height="56"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: "#1976d2" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Box>

          <Typography variant="h6" fontWeight={600} gutterBottom>
            Application Already Submitted
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            You've already applied for this property. Check your units or find
            other available listings.
          </Typography>

          <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/pages/tenant/my-unit")}
            >
              View My Units
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push("/pages/find-rent")}
            >
              Find Another
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      maxWidth={{ xs: "100%", sm: "600px", md: "700px" }}
      mx="auto"
      py={{ xs: 2, sm: 6 }}
      px={{ xs: 2, sm: 4 }}
      pb={{ xs: 20, sm: 6 }}
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography
        variant={isMobile ? "h6" : "h4"}
        align="center"
        fontWeight={700}
        gutterBottom
      >
        {propertyDetails
          ? `${propertyDetails.property_name} – Unit ${propertyDetails.unit_name} Tenant Application`
          : "Tenant Application Form"}
      </Typography>

      {/* Stepper */}
      <Stepper
        activeStep={activeStep}
        alternativeLabel={!isMobile}
        orientation={isMobile ? "vertical" : "horizontal"}
        sx={{
          mb: { xs: 2, sm: 4 },
          "& .MuiStepLabel-label": {
            fontSize: { xs: "0.8rem", sm: "1rem" },
          },
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Form Steps */}
      <form
        onSubmit={handleFormSubmit}
        style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        <Box sx={{ flexGrow: 1, mb: { xs: 2, sm: 4 } }}>
          {/* Step 1 */}
          {activeStep === 0 && (
            <Box display="grid" gap={2} pb={{ xs: 2, sm: 0 }}>
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                fullWidth
              />
              <TextField
                label="Birth Date"
                type="date"
                value={formData.birthDate}
                onChange={(e) => {
                  setFormData({ ...formData, birthDate: e.target.value });
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  max: new Date().toISOString().split("T")[0],
                  style: { fontSize: isMobile ? "16px" : "14px" }, // Prevents zoom on iOS
                }}
                helperText="You must be 18 years or older"
                fullWidth
                required
              />
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
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                InputProps={{ readOnly: true }}
                value={formData.email}
                fullWidth
              />
              <TextField
                label="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                inputProps={{
                  style: { fontSize: isMobile ? "16px" : "14px" },
                }}
                fullWidth
              />
            </Box>
          )}

          {/* Step 2 */}
          {activeStep === 1 && (
            <Box display="grid" gap={2} pb={{ xs: 2, sm: 0 }}>
              <FormControl fullWidth>
                <InputLabel>Occupation</InputLabel>
                <Select
                  value={formData.occupation}
                  label="Occupation"
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

              <FormControl fullWidth>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={formData.employment_type}
                  label="Employment Type"
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

              <FormControl fullWidth>
                <InputLabel>Monthly Income</InputLabel>
                <Select
                  value={formData.monthly_income}
                  label="Monthly Income"
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
          )}

          {/* Step 3 */}
          {activeStep === 2 && (
            <Box display="grid" gap={3} pb={{ xs: 2, sm: 0 }}>
              {/* Valid ID */}
              <Box
                p={3}
                border="2px dashed #ccc"
                textAlign="center"
                borderRadius={2}
                onClick={() => validIdRef.current.click()}
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "#f9f9f9",
                  },
                }}
              >
                <FiUploadCloud size={28} className="mx-auto mb-2" />
                <Typography variant="body2">
                  Upload or Capture Valid ID (JPEG/PNG)
                </Typography>
                <input
                  type="file"
                  ref={validIdRef}
                  hidden
                  accept="image/jpeg,image/png"
                  onChange={(e) => handleFileSelect(e, "id")}
                />
                {validIdFile && (
                  <Typography
                    variant="caption"
                    display="block"
                    mt={1}
                    color="success.main"
                  >
                    ✓ {validIdFile.name}
                  </Typography>
                )}
              </Box>

              {/* Proof of Income */}
              <Box
                p={3}
                border="2px dashed #ccc"
                textAlign="center"
                borderRadius={2}
                onClick={() => incomeRef.current.click()}
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "#f9f9f9",
                  },
                }}
              >
                <FiUploadCloud size={28} className="mx-auto mb-2" />
                <Typography variant="body2">
                  Upload or Capture Proof of Income
                </Typography>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  display={{ xs: "none", sm: "block" }}
                >
                  Accepted: Certificate of Employment, Payslips, Bank
                  Statements, ITR, Employment Contract, etc.
                </Typography>
                <input
                  type="file"
                  ref={incomeRef}
                  hidden
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => handleFileSelect(e, "income")}
                />
                {incomeFile && (
                  <Typography
                    variant="caption"
                    display="block"
                    mt={1}
                    color="success.main"
                  >
                    ✓ {incomeFile.name}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* Navigation Buttons - Fixed at bottom on mobile */}
        <Box
          sx={{
            position: { xs: "fixed", sm: "static" },
            bottom: { xs: 0, sm: "auto" },
            left: { xs: 0, sm: "auto" },
            right: { xs: 0, sm: "auto" },
            bgcolor: { xs: "background.paper", sm: "transparent" },
            p: { xs: 2, sm: 0 },
            boxShadow: { xs: "0 -2px 10px rgba(0,0,0,0.1)", sm: "none" },
            zIndex: { xs: 10, sm: "auto" },
            mt: { xs: 0, sm: 4 },
          }}
        >
          {/* Mobile Layout - Stacked */}
          <Box
            sx={{
              display: { xs: "flex", sm: "none" },
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Step Navigation Row */}
            <Box display="flex" gap={2}>
              {activeStep > 0 && (
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    minHeight: "48px",
                    fontSize: "0.95rem",
                    flex: 1,
                  }}
                  onClick={() => setActiveStep((s) => s - 1)}
                >
                  Back
                </Button>
              )}
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    minHeight: "48px",
                    fontSize: "0.95rem",
                    flex: activeStep > 0 ? 1 : 1,
                  }}
                  onClick={handleNextStep}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  type="button"
                  sx={{
                    minHeight: "48px",
                    fontSize: "0.95rem",
                    flex: 1,
                  }}
                  onClick={handleFormSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </Box>

            {/* Cancel Row */}
            <Button
              variant="text"
              color="error"
              fullWidth
              sx={{
                minHeight: "44px",
                fontSize: "0.85rem",
              }}
              onClick={() => {
                Swal.fire({
                  title: "Cancel Application?",
                  text: "Your progress will not be saved. Do you want to return to property listings?",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#d33",
                  cancelButtonColor: "#3085d6",
                  confirmButtonText: "Yes, cancel",
                }).then((result) => {
                  if (result.isConfirmed) {
                    router.replace(
                      `/pages/find-rent/${propertyDetails?.property_id}/${unit_id}`
                    );
                  }
                });
              }}
            >
              Cancel Application
            </Button>
          </Box>

          {/* Desktop Layout - Original */}
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* Left: Cancel */}
            <Button
              variant="text"
              color="error"
              onClick={() => {
                Swal.fire({
                  title: "Cancel Application?",
                  text: "Your progress will not be saved. Do you want to return to property listings?",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#d33",
                  cancelButtonColor: "#3085d6",
                  confirmButtonText: "Yes, cancel",
                }).then((result) => {
                  if (result.isConfirmed) {
                    router.replace(
                      `/pages/find-rent/${propertyDetails?.property_id}/${unit_id}`
                    );
                  }
                });
              }}
            >
              Cancel Application
            </Button>

            {/* Right: Step Navigation */}
            <Box display="flex" gap={2}>
              {activeStep > 0 && (
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep((s) => s - 1)}
                >
                  Back
                </Button>
              )}
              {activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNextStep}>
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="success"
                  type="button"
                  onClick={handleFormSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default TenantApplicationForm;
