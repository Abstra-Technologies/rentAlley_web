export const createPropertySteps = [
  {
    element: "#property-type-section",
    popover: {
      title: "Choose Your Property Type",
      description:
        "Start by selecting what type of property you're listing - apartment, house, duplex, or commercial space. This helps tenants find exactly what they're looking for.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#property-name-section",
    popover: {
      title: "Name Your Property",
      description:
        "Give your property a memorable name that tenants will recognize. Make it descriptive and appealing!",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#location-section",
    popover: {
      title: "Set Property Location",
      description:
        "Enter your property address. You can type it manually, use your current location, or pin it directly on the map. Accurate location helps tenants find you easily.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#amenities-section",
    popover: {
      title: "Highlight Your Amenities",
      description:
        "Select all amenities your property offers. Features like WiFi, parking, and security attract more tenants!",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#description-section",
    popover: {
      title: "Describe Your Property",
      description:
        "Write a compelling description or use our AI generator to create one automatically based on your property details.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#preferences-section",
    popover: {
      title: "Set Preferences & Rules",
      description:
        "Specify tenant preferences like pet-friendly, gender restrictions, or other house rules to attract the right tenants.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#billing-section",
    popover: {
      title: "Configure Utility Billing",
      description:
        "Choose how water and electricity are billed - included in rent, direct to provider, or submetered.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#photos-section",
    popover: {
      title: "Upload Property Photos",
      description:
        "Add at least 3 high-quality photos of your property. Great photos make your listing stand out! Drag and drop or click to upload.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#rent-increase-section",
    popover: {
      title: "Set Rent Increase Policy",
      description:
        "Define your annual rent increase percentage. This will be applied automatically during lease renewals.",
      side: "top",
      align: "start",
    },
  },
  {
    popover: {
      title: "You're All Set! 🎉",
      description:
        'After filling in these details, click "Continue" to upload verification documents. Once submitted, your property will be reviewed and published within 24-48 hours.',
    },
  },
];

export const verificationDocsSteps = [
  {
    element: "#doc-type-section",
    popover: {
      title: "Select Document Type",
      description:
        "Choose the legal document you're submitting - Business Permit, Mayor Permit, or Property Title.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#document-uploads",
    popover: {
      title: "Upload Legal Documents",
      description:
        "Upload your legal document (PDF only) and a government-issued ID for verification. These ensure trust and safety for tenants.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#photo-capture-section",
    popover: {
      title: "Capture Verification Photos",
      description:
        "Take clear indoor and outdoor photos of your property using your camera. This helps verify your listing is legitimate.",
      side: "top",
      align: "start",
    },
  },
  {
    popover: {
      title: "Ready to Submit! ✅",
      description:
        "Once all documents and photos are uploaded, click \"Submit Listing\" to send your property for verification. You'll be notified via email when it's approved!",
    },
  },
];
