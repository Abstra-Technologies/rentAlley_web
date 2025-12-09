export const leaseGenerationSteps = [
  {
    popover: {
      title: "Lease Generation Wizard 🧙‍♂️",
      description:
        "Welcome to UpKyp's guided lease generator! We'll walk you through 5 steps to create a professional, legally-sound lease agreement. Let's start with the basics.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#lease-type-selection",
    popover: {
      title: "Step 1: Choose Lease Type",
      description:
        'Select "Residential" for homes, apartments, and condos. Select "Commercial" for offices, shops, and business spaces. This determines which legal terms apply.',
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#parties-information",
    popover: {
      title: "Tenant & Landlord Details",
      description:
        "Review both parties' information. This includes names, contact details, citizenship, civil status, and age. All details will appear in the final lease document.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#contract-terms-form",
    popover: {
      title: "Contract Financial Terms",
      description:
        "Set the lease dates, monthly rent, security deposit, advance payment, billing due day, grace period, and late fees. These are the core financial terms of your agreement.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#change-warning",
    popover: {
      title: "Smart Change Detection",
      description:
        "If you modify rent, dates, or other settings from property defaults, UpKyp will automatically update the property, unit, and lease configurations to match.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#additional-policies-form",
    popover: {
      title: "Step 2: Additional Lease Policies",
      description:
        "Define important house rules: allowed occupants, maintenance responsibilities, pet policy, smoking rules, utilities, furnishing, termination clauses, and entry notice requirements.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#occupants-notice",
    popover: {
      title: "Occupancy & Notice Periods",
      description:
        "Set how many people can live in the unit and how much notice is required before terminating the lease. Standard is 30 days notice.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#maintenance-pets-smoking",
    popover: {
      title: "Property Rules",
      description:
        "Define who handles repairs, whether pets are allowed, and smoking policies. These policies will appear in the lease document.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#utilities-furnishing",
    popover: {
      title: "Utilities & Furnishing",
      description:
        "Specify who pays for utilities and what furnishings are included. This prevents disputes about what's provided with the rental.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#termination-entry",
    popover: {
      title: "Termination & Entry Rules",
      description:
        "Set conditions for ending the lease early and how much notice you must give before entering the unit. These protect both landlord and tenant rights.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#review-section",
    popover: {
      title: "Step 3: Review All Details",
      description:
        "Carefully review ALL lease terms before generating. Once confirmed, these details cannot be modified without creating a new lease record.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#attestation-checkbox",
    popover: {
      title: "Legal Attestation Required",
      description:
        "Check this box to attest that all information is true and correct. This is a legal requirement before generating the binding lease document.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#generate-button",
    popover: {
      title: "Generate Lease Document",
      description:
        "Click to generate your professional lease agreement. UpKyp will create a PDF document with all terms, ready for digital signing.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#otp-authentication",
    popover: {
      title: "Step 4: Digital Signature via OTP",
      description:
        "To sign the lease digitally, authenticate using a one-time password sent to your registered email. This ensures only you can sign the document.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#otp-input",
    popover: {
      title: "Enter Verification Code",
      description:
        "Enter the 6-digit code sent to your email. This verifies your identity and applies your digital signature to the lease agreement.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#resend-otp",
    popover: {
      title: "Resend Code Option",
      description:
        'Didn\'t receive the code? Wait for the cooldown timer and click "Resend OTP" to get a new verification code.',
      side: "top",
      align: "start",
    },
  },
  {
    popover: {
      title: "Lease Creation Complete! 🎉",
      description:
        "You've learned how to create comprehensive lease agreements using UpKyp's guided system. Your lease is now ready for the tenant to sign!",
    },
  },
];
