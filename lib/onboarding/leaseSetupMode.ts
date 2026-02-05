// Onboarding for Step 1: Mode Selection (choosing upload vs generate)
export const leaseSetupSteps = [
  {
    popover: {
      title: "Welcome to Lease Setup 📝",
      description:
        "Let's set up a lease agreement for your tenant. You have two options to choose from — pick the one that fits your situation best.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#mode-selection",
    popover: {
      title: "Choose Your Method",
      description:
        "Select how you'd like to proceed: upload an existing document you've already signed, or generate a brand new lease using UpKyp's guided wizard.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#upload-option",
    popover: {
      title: "Upload Existing Lease",
      description:
        "Already have a signed lease agreement? Choose this option to upload your PDF or DOCX file and record the key details in UpKyp.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#generate-option",
    popover: {
      title: "Generate New Lease",
      description:
        "Don't have a lease yet? UpKyp will guide you through creating a professional, legally-formatted lease agreement with all the important clauses.",
      side: "left",
      align: "start",
    },
  },
  {
    popover: {
      title: "Ready to Continue! ✨",
      description:
        "Select your preferred method and click 'Continue' to proceed. Each path has its own guided walkthrough to help you along the way.",
      side: "bottom",
      align: "center",
    },
  },
];

// Onboarding for Step 2: Upload Existing Lease form
export const leaseUploadSteps = [
  {
    popover: {
      title: "Upload Your Lease Document 📄",
      description:
        "Now let's record your existing lease agreement. Fill in the details below and upload your signed document.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#tenant-info-summary",
    popover: {
      title: "Tenant & Property Info",
      description:
        "Review the tenant and property details here. This information will be linked to the lease record automatically.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#lease-dates",
    popover: {
      title: "Lease Duration",
      description:
        "Enter the start and end dates of your lease. The start date is required — end date can be left blank for month-to-month arrangements.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#financial-details",
    popover: {
      title: "Financial Terms",
      description:
        "Enter the monthly rent amount (required), plus any security deposit and advance payment collected from the tenant.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#file-upload-area",
    popover: {
      title: "Upload Document",
      description:
        "Click or drag to upload your signed lease document. Supported formats: PDF and DOCX (max 10MB). This file will be stored securely.",
      side: "top",
      align: "center",
    },
  },
  {
    popover: {
      title: "Almost Done! 🎉",
      description:
        "Once you've filled in the details and uploaded your document, click 'Submit Agreement' to complete the setup.",
      side: "bottom",
      align: "center",
    },
  },
];
