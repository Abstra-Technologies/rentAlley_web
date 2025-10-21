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

  // ✅ Fetch profile + property info
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
              You’ve already applied for this property. Check your units or find
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
          py={{ xs: 3, sm: 6 }}
          px={{ xs: 2, sm: 4 }}
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
              mb: { xs: 3, sm: 4 },
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
        <form onSubmit={handleFormSubmit}>
          {/* Step 1 */}
          {activeStep === 0 && (
              <Box display="grid" gap={2}>
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
                      const selectedDate = new Date(e.target.value);
                      const today = new Date();
                      const age = today.getFullYear() - selectedDate.getFullYear();
                      const monthDiff = today.getMonth() - selectedDate.getMonth();
                      const dayDiff = today.getDate() - selectedDate.getDate();
                      if (
                          age > 18 ||
                          (age === 18 &&
                              (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))
                      ) {
                        setFormData({ ...formData, birthDate: e.target.value });
                      } else {
                        setFormData({ ...formData, birthDate: "" });
                        alert("You must be 18 or older.");
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: new Date().toISOString().split("T")[0] }}
                    fullWidth
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
                    inputProps={{ maxLength: 12, minLength: 11 }}
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
                    fullWidth
                />
              </Box>
          )}

          {/* Step 2 */}
          {activeStep === 1 && (
              <Box display="grid" gap={2}>
                <FormControl fullWidth>
                  <InputLabel>Occupation</InputLabel>
                  <Select
                      value={formData.occupation}
                      label="Occupation"
                      onChange={(e) =>
                          setFormData({ ...formData, occupation: e.target.value })
                      }
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
              <Box display="grid" gap={3}>
                {/* Valid ID */}
                <Box
                    p={3}
                    border="2px dashed #ccc"
                    textAlign="center"
                    borderRadius={2}
                    onClick={() => validIdRef.current.click()}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { borderColor: "primary.main", bgcolor: "#f9f9f9" },
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
                      capture="environment"
                      onChange={(e) => handleFileSelect(e, "id")}
                  />
                  {validIdFile && (
                      <Typography variant="caption">{validIdFile.name}</Typography>
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
                      "&:hover": { borderColor: "primary.main", bgcolor: "#f9f9f9" },
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
                    Accepted: Certificate of Employment, Payslips, Bank Statements,
                    ITR, Employment Contract, etc.
                  </Typography>
                  <input
                      type="file"
                      ref={incomeRef}
                      hidden
                      accept="image/jpeg,image/png,application/pdf"
                      capture="environment"
                      onChange={(e) => handleFileSelect(e, "income")}
                  />
                  {incomeFile && (
                      <Typography variant="caption">{incomeFile.name}</Typography>
                  )}
                </Box>
              </Box>
          )}

          {/* Navigation Buttons */}
          {/* Navigation Buttons */}
          <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              gap={2}
              mt={4}
          >
            {/* Left: Cancel */}
            <Button
                variant="text"
                color="error"
                fullWidth={isMobile}
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
                      router.replace(`/pages/find-rent/${propertyDetails?.property_id}/${unit_id}`);                    }
                  });
                }}
            >
              Cancel Application
            </Button>

            {/* Step Navigation */}
            <Box
                display="flex"
                flexDirection={{ xs: "column", sm: "row" }}
                justifyContent="flex-end"
                gap={2}
                flexGrow={1}
            >
              {activeStep > 0 && (
                  <Button
                      variant="outlined"
                      fullWidth={isMobile}
                      onClick={() => setActiveStep((s) => s - 1)}
                  >
                    Back
                  </Button>
              )}
              {activeStep < steps.length - 1 ? (
                  <Button
                      variant="contained"
                      fullWidth={isMobile}
                      onClick={() => setActiveStep((s) => s + 1)}
                  >
                    Next
                  </Button>
              ) : (
                  <Button
                      variant="contained"
                      color="success"
                      fullWidth={isMobile}
                      type="button"
                      onClick={handleFormSubmit}
                      disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </Button>
              )}
            </Box>
          </Box>

        </form>
      </Box>
  );
};

export default TenantApplicationForm;
