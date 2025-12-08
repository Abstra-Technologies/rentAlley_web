export const propertyBillingSteps = [
  {
    element: "#billing-stats-section",
    popover: {
      title: "Billing Overview",
      description:
        "Quick stats showing total units, billing completion, amount due, and payment status at a glance.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#action-buttons-section",
    popover: {
      title: "Billing Actions",
      description:
        "Set utility rates for submetered properties and download billing summaries. These actions require property configuration to be completed first.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#rate-status-indicator",
    popover: {
      title: "Rate Status",
      description:
        "Shows whether utility rates have been set for the current billing period. For submetered properties, you need to set rates before generating bills.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#units-list-section",
    popover: {
      title: "Units Billing List",
      description:
        'All active units in this property. Each unit shows its billing status, amount due, and actions you can take. Click "Generate Bill" to create new bills or "Review Bill" to view existing ones.',
      side: "top",
      align: "start",
    },
  },
  {
    popover: {
      title: "You're All Set! 💰",
      description:
        "You can now manage all property billing from this dashboard. Remember to set utility rates monthly for submetered properties, and generate bills for each unit before the due date.",
    },
  },
];

// Optional: Tour for the Property Rates Modal
export const propertyRatesModalSteps = [
  {
    element: "#reading-period-section",
    popover: {
      title: "Set Reading Period",
      description:
        "Define the start and end dates for this billing cycle. This should match your actual utility meter reading dates.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#electricity-rates-section",
    popover: {
      title: "Electricity Billing",
      description:
        "Enter the total electricity consumption (kWh) and total amount from your utility bill. The rate per kWh will be calculated automatically.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#water-rates-section",
    popover: {
      title: "Water Billing",
      description:
        "Enter the total water consumption (cubic meters) and total amount from your utility bill. The rate per cubic meter will be calculated automatically.",
      side: "top",
      align: "start",
    },
  },
  {
    popover: {
      title: "Save Your Rates!",
      description:
        "Once saved, these rates will be used to calculate individual unit bills based on their meter readings. You can update them anytime if needed.",
    },
  },
];
