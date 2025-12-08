export const createUnitBillSteps = [
  {
    element: "#utility-rates-card",
    popover: {
      title: "Property Utility Rates",
      description:
        "These rates are automatically calculated from your property's latest utility bills. They'll be used to compute this unit's water and electricity charges.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#dates-form-section",
    popover: {
      title: "Set Billing Dates",
      description:
        "Enter the billing date, meter reading date, and payment due date. The due date is based on your property configuration.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#meter-readings-section",
    popover: {
      title: "Enter Meter Readings",
      description:
        "Input the previous and current readings for water and electricity meters. The system will automatically calculate consumption and costs.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#extra-charges-section",
    popover: {
      title: "Add Extra Charges",
      description:
        "Include any additional fees like parking, association dues, or maintenance charges. These will be added to the total bill.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#discounts-section",
    popover: {
      title: "Apply Discounts",
      description:
        "Add discounts such as promotional offers, loyalty rewards, or goodwill adjustments. These will reduce the total amount due.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#billing-summary-section",
    popover: {
      title: "Review Bill Summary",
      description:
        "Check the computed totals including rent, utilities, additional charges, and discounts. This shows the final amount the tenant needs to pay.",
      side: "left",
      align: "start",
    },
  },
  {
    element: "#pdc-card-section",
    popover: {
      title: "Post-Dated Check (PDC)",
      description:
        "If the tenant provided a PDC, you can mark it as cleared here. Cleared PDCs will automatically reduce the amount due.",
      side: "left",
      align: "start",
    },
  },
  {
    popover: {
      title: "Ready to Submit! 💰",
      description:
        'Once you\'ve reviewed everything, click "Submit Billing" to create the bill. You can then proceed to the next unit or stay to review.',
    },
  },
];
