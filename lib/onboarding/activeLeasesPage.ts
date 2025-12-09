export const activeLeasesSteps = [
  {
    popover: {
      title: "Welcome to Lease Management! 📋",
      description:
        "This is your central hub for managing all lease agreements. Let's explore how to view, authenticate, and set up leases for your properties.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#leases-header",
    popover: {
      title: "Leases Overview",
      description:
        "See all your lease agreements at a glance. The count shows total leases including active leases, pending signatures, and sent invites.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#leases-table",
    popover: {
      title: "Leases Table",
      description:
        "View all lease details including unit, tenant, start/end dates, and current status. Each row shows a different lease agreement.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#status-column",
    popover: {
      title: "Lease Status Indicators",
      description:
        'Status badges show the current state: "Active" (signed and in effect), "Pending Signature" (waiting for landlord or tenant), or "Invite Pending" (tenant hasn\'t registered yet).',
      side: "left",
      align: "start",
    },
  },
  {
    element: "#action-buttons",
    popover: {
      title: "Action Buttons",
      description:
        'Different actions appear based on lease status: "View Details" for active leases, "Authenticate" when tenant has signed but you haven\'t, and "Setup" to begin lease configuration.',
      side: "left",
      align: "start",
    },
  },
  {
    element: "#view-details-btn",
    popover: {
      title: "View Lease Details",
      description:
        "Click to see complete lease information including terms, dates, amounts, and both parties' information. Available for active or partially signed leases.",
      side: "left",
      align: "start",
    },
  },
  {
    element: "#authenticate-btn",
    popover: {
      title: "Authenticate & Sign",
      description:
        "When the tenant has signed but you haven't, this button appears. Click to verify your identity with OTP and digitally sign the lease agreement.",
      side: "left",
      align: "start",
    },
  },
  {
    element: "#setup-btn",
    popover: {
      title: "Setup Lease Agreement",
      description:
        "Start the lease creation process. You'll choose requirements, upload an existing document, or generate a new lease using UpKyp's guided system.",
      side: "left",
      align: "start",
    },
  },
  {
    popover: {
      title: "Ready to Manage Leases! ✅",
      description:
        'You now understand how to view lease statuses and take the appropriate actions. Click any "Setup" button to begin creating a lease agreement.',
    },
  },
];
