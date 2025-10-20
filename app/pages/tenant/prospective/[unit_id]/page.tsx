

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

    console.log('user bday:', user?.user_id);

    const fetchTenantData = async () => {
      try {
        const res = await axios.get(`/api/tenant/profile`, {
          params: { tenant_id: user.tenant_id },
        });

        if (res.data.tenant) {
          const t = res.data.tenant;
          setFormData((prev) => ({
            ...prev,
            occupation: user.occupation || "",
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


  // Fetch property
  useEffect(() => {
    if (!unit_id) return;
    axios
        .get(`/api/propertyListing/getPropertyDetailByUnitId`, {
          params: { unit_id },
        })
        .then((res) => setPropertyDetails(res.data.propertyDetails))
        .catch((err) => console.error("Fetch error:", err.message));
  }, [unit_id]);

  // Check application
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

  // Preload user info
  useEffect(() => {
    if (unit_id) {
      // @ts-ignore
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

    if (!user?.user_id || !user?.tenant_id) {
      return Swal.fire("Error", "Please log in.", "error");
    }
    if (!validIdFile) {
      return Swal.fire("Error", "Please upload a valid ID.", "error");
    }
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
    const loadingSwal = Swal.fire({
      title: "Submitting...",
      text: "Please wait while we process your application.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // ✅ Build FormData payload
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

      // ✅ Send to backend
      await axios.post("/api/tenant/applications/submitApplication", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ Close loading and show success
      Swal.close();
      await Swal.fire({
        title: "Success!",
        text: "Your application has been submitted successfully.",
        icon: "success",
        confirmButtonText: "Continue",
        timer: 2000,
        showConfirmButton: false,
      });

      // ✅ Redirect after a short delay
      router.push("/pages/tenant/prospective/success");
    } catch (err) {
      Swal.close();
      Swal.fire("Error", err.message || "Submission failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || loading) {
    return <LoadingScreen message="Just a moment, preparing your form..." />;
  }

  if (hasApplied) {

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="60vh"
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
            {/* Icon */}
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                mb={2}
            >
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

            {/* Message */}
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Application Already Submitted
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              You have already applied for this property. Please check your units or
              explore other available rentals.
            </Typography>

            {/* Actions */}
            <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
              <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => router.push("/pages/tenant/my-unit")}
              >
                View My Units
              </Button>
              <Button
                  variant="outlined"
                  size="large"
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
      <Box maxWidth="md" mx="auto" py={6}>
        <Typography variant="h4" align="center" gutterBottom>
          {propertyDetails
              ? `${propertyDetails.property_name} – Unit ${propertyDetails.unit_name} Tenant Application`
              : "Tenant Application Form"}
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
          ))}
        </Stepper>

        <form onSubmit={handleFormSubmit}>
          {/* Step 1 */}
          {activeStep === 0 && (
              <Box display="grid" gap={3}>
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

                      // Check if user is at least 18 years old
                      if (
                          age > 18 ||
                          (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))
                      ) {
                        setFormData({ ...formData, birthDate: e.target.value });
                      } else {
                        // Optionally, reset the field or show an error
                        setFormData({ ...formData, birthDate: '' });
                        alert('You must be 18 or older.');
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: new Date().toISOString().split('T')[0] }} // Prevents future dates
                    fullWidth
                />
                <TextField
                    label="Mobile Number"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only digits and ensure length is 11 to 12
                      if (/^\d{0,12}$/.test(value)) {
                        setFormData({ ...formData, phoneNumber: value });
                      }
                    }}
                    inputProps={{
                      pattern: "\\d{11,12}",
                      maxLength: 12,
                      minLength: 11
                    }}
                    fullWidth
                />
                <TextField
                    label="Email"
                    type="email"
                    InputProps={{ readOnly: true }}
                    value={formData.email}
                    onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                    }
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
              <Box display="grid" gap={3}>
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
                          setFormData({ ...formData, employment_type: e.target.value })
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
                          setFormData({ ...formData, monthly_income: e.target.value })
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
              <Box display="grid" gap={4}>
                {/* Valid ID */}
                <Box
                    p={3}
                    border="2px dashed #ccc"
                    textAlign="center"
                    borderRadius={2}
                    onClick={() => validIdRef.current.click()}
                    sx={{ cursor: "pointer" }}
                >
                  <FiUploadCloud size={28} className="mx-auto mb-2" />
                  <Typography>Upload or Capture Valid ID (JPEG/PNG)</Typography>
                  <input
                      type="file"
                      ref={validIdRef}
                      hidden
                      accept="image/jpeg,image/png"
                      capture="environment" // ✅ opens camera by default on mobile
                      onChange={(e) => handleFileSelect(e, "id")}
                  />
                  {validIdFile && <Typography>{validIdFile.name}</Typography>}
                </Box>

                {/* Proof of Income */}
                <Box
                    p={3}
                    border="2px dashed #ccc"
                    textAlign="center"
                    borderRadius={2}
                    onClick={() => incomeRef.current.click()}
                    sx={{ cursor: "pointer" }}
                >
                  <FiUploadCloud size={28} className="mx-auto mb-2" />
                  <Typography>Upload or Capture Proof of Income</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Accepted: Certificate of Employment, Latest Payslips, Bank Statements, Income Tax Return (ITR),
                    Employment Contract, Letter of Employment, Remittance Slips, Proof of Freelance Income,
                    Government-issued Benefit Slips (e.g., SSS, GSIS, Pension),
                    Company-issued Salary Certificate, or Other Official Proof of Income
                  </Typography>

                  <input
                      type="file"
                      ref={incomeRef}
                      hidden
                      accept="image/jpeg,image/png,application/pdf"
                      capture="environment" // ✅ camera option on supported devices
                      onChange={(e) => handleFileSelect(e, "income")}
                  />
                  {incomeFile && <Typography>{incomeFile.name}</Typography>}
                </Box>
              </Box>
          )}


          {/* Navigation Buttons */}
          <Box display="flex" justifyContent="space-between" mt={4}>
            {activeStep > 0 && (
                <Button
                    variant="outlined"
                    type="button"
                    onClick={() => setActiveStep((s) => s - 1)}
                >
                  Back
                </Button>
            )}
            {activeStep < steps.length - 1 ? (
                <Button
                    variant="contained"
                    type="button"
                    onClick={() => setActiveStep((s) => s + 1)}
                >
                  Next
                </Button>
            ) : (
                <Button
                    variant="contained"
                    color="success"
                    type="button"   // ✅ prevent auto-submit
                    onClick={handleFormSubmit}  // ✅ only trigger validation here
                    disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
            )}
          </Box>


        </form>
      </Box>
  );
};

export default TenantApplicationForm;
