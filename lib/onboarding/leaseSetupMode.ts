export const leaseSetupSteps = [
  {
    popover: {
      title: "Setup Lease Agreement 📝",
      description:
        "You're about to create a lease agreement. First, choose how you want to set it up: upload an existing document or generate a new one with UpKyp's guided system.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#mode-selection",
    popover: {
      title: "Choose Your Setup Method",
      description:
        "Two options available: Upload an existing signed lease document (PDF/DOCX), or generate a brand new lease using UpKyp's comprehensive lease generator.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#upload-option",
    popover: {
      title: "Upload Existing Lease",
      description:
        "Select this if you already have a lease agreement signed outside UpKyp. You'll upload the document and enter key details like dates and amounts.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#generate-option",
    popover: {
      title: "Generate New Lease",
      description:
        "Select this to create a professional lease agreement from scratch. UpKyp will guide you through contract terms, policies, and digital signing.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tenant-info-summary",
    popover: {
      title: "Tenant & Lease Information",
      description:
        "Review the tenant details and property information. This data will be included in your lease agreement automatically.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#lease-dates",
    popover: {
      title: "Lease Duration",
      description:
        "Set the start and end dates for this lease. These dates determine when the tenant can occupy the unit and when the lease expires.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#financial-details",
    popover: {
      title: "Financial Terms",
      description:
        "Enter monthly rent, security deposit, and advance payment amounts. These must match what you agreed with the tenant.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#file-upload-area",
    popover: {
      title: "Upload Lease Document",
      description:
        "Drag and drop or click to upload your lease document. Supported formats: PDF and DOCX. The file will be stored securely in UpKyp.",
      side: "top",
      align: "start",
    },
  },
  {
    popover: {
      title: "Setup Method Selected! 🎯",
      description:
        "Continue to complete your lease setup. If generating a new lease, you'll go through a comprehensive wizard with contract terms and policies.",
    },
  },
];
