export const propertyBillingSteps = [
  {
    element: "#billing-stats-section",
    popover: {
      title: "📊 Billing Overview",
      description:
        "Quick stats showing total units, billing completion, amount due, and payment status at a glance. Monitor your property's billing health from here.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#action-buttons-section",
    popover: {
      title: "⚡ Billing Actions",
      description:
        "Set utility rates for submetered properties (water & electricity) and download billing summaries as PDF. These actions require property configuration to be completed first.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#rate-status-indicator",
    popover: {
      title: "📈 Rate Status",
      description:
        "Shows whether utility rates have been configured for the current billing period. For submetered properties, you must set rates before generating individual unit bills.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#units-list-section",
    popover: {
      title: "🏠 Units Billing List",
      description:
        'All active units in this property are listed here. Each unit shows its billing status and amount due. Click "Open" to create or review the bill for each unit.',
      side: "top",
      align: "start",
    },
  },
  {
    popover: {
      title: "You're All Set! 💰",
      description:
        "You can now manage all property billing from this dashboard. Remember to:\n\n• Set utility rates monthly for submetered properties\n• Generate bills for each unit before the due date\n• Download summaries for your records",
    },
  },
];

// Tour for the Property Rates Modal
export const propertyRatesModalSteps = [
  {
    element: "#reading-period-section",
    popover: {
      title: "📅 Set Reading Period",
      description:
        "Define the start and end dates for this billing cycle. This should match your actual utility meter reading dates from your concessionaire bill.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#electricity-rates-section",
    popover: {
      title: "⚡ Electricity Billing",
      description:
        "Enter the total electricity consumption (kWh) and total amount from your Meralco or electric company bill. The rate per kWh will be calculated automatically using the formula: Total ÷ Consumption.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#water-rates-section",
    popover: {
      title: "💧 Water Billing",
      description:
        "Enter the total water consumption (cubic meters) and total amount from your water utility bill. The rate per cubic meter will be calculated automatically.",
      side: "top",
      align: "start",
    },
  },
  {
    popover: {
      title: "Save Your Rates! 💾",
      description:
        "Once saved, these rates will be used to calculate individual unit bills based on their meter readings.\n\n⚠️ Important: Rates should not be changed after bills have been generated for the period.",
    },
  },
];

// Tour for CreateUnitBill page
export const createUnitBillSteps = [
  {
    element: "#billing-period-section",
    popover: {
      title: "📅 Billing Period",
      description:
        "The billing date and due date for this statement. The due date is automatically calculated based on your property configuration.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#base-rent-section",
    popover: {
      title: "🏠 Base Rent",
      description:
        "Shows the monthly rent and association dues for this unit. If the tenant has a post-dated check (PDC), it will appear here.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#utility-rates-section",
    popover: {
      title: "⚡ Utility Rates",
      description:
        "Displays the computed rates for water and electricity. These are calculated from the property-level rates you set in the Property Billing page.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#meter-readings-section",
    popover: {
      title: "📊 Meter Readings",
      description:
        "Enter the previous and current meter readings for water and electricity. The usage and cost will be calculated automatically based on the rates.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#adjustments-section",
    popover: {
      title: "➕ Adjustments",
      description:
        "Add any additional charges (repairs, penalties) or discounts (early payment, loyalty) to the bill. These will be reflected in the final total.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#billing-summary-section",
    popover: {
      title: "💰 Billing Summary",
      description:
        "The complete breakdown of all charges and the final amount due. Review everything before submitting the bill.",
      side: "top",
      align: "start",
    },
  },
  {
    popover: {
      title: "Ready to Bill! 🎉",
      description:
        "Once submitted, the tenant will be notified of their billing statement. You can update the bill anytime if needed before the due date.",
    },
  },
];
