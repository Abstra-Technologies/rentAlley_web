export const propertyConfigSteps = [
  {
    popover: {
      title: "Welcome to Property Configuration! ⚙️",
      description:
        "This page controls how billing works for your entire property. Let's walk through each important setting to ensure everything is configured correctly.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#notifications-section",
    popover: {
      title: "Billing Notifications",
      description:
        "Set when tenants receive billing reminders and payment due date notifications. These settings help reduce late payments.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#reminder-day",
    popover: {
      title: "Reminder Day",
      description:
        "Choose which day of the month tenants receive billing reminders. For example, set to 25th if billing is due on the 1st.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#due-day",
    popover: {
      title: "Billing Due Date",
      description:
        "This is when rent is officially due each month. All your tenant bills will use this due date. Common choices are the 1st, 5th, or 15th of the month.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#notification-channels",
    popover: {
      title: "Notification Channels",
      description:
        "Enable Email and/or SMS notifications. Tenants will receive automatic reminders through your selected channels.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#utility-billing-section",
    popover: {
      title: "Utility Billing Configuration",
      description:
        'Critical setting! Choose how water and electricity are billed: "Included" (flat rate in rent) or "Submetered" (based on actual consumption).',
      side: "top",
      align: "start",
    },
  },
  {
    element: "#water-billing-type",
    popover: {
      title: "Water Billing Type",
      description:
        'Select "Included" if water is part of the rent, or "Submetered" if you charge based on meter readings. Changing this affects all future bills.',
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#electricity-billing-type",
    popover: {
      title: "Electricity Billing Type",
      description:
        'Select "Included" if electricity is part of the rent, or "Submetered" if you charge based on meter readings. Changing this affects all future bills.',
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#late-payment-section",
    popover: {
      title: "Late Payment Penalties",
      description:
        "Configure automatic late fees for overdue payments. Set the penalty type, amount, and grace period before fees apply.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#penalty-type",
    popover: {
      title: "Penalty Type",
      description:
        'Choose "Fixed Amount" (₱200 per day) or "Percentage" (5% per day). Fixed is simpler; percentage scales with rent amount.',
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#penalty-amount",
    popover: {
      title: "Penalty Amount/Rate",
      description:
        "Set how much to charge per day after the grace period. Example: ₱200 per day or 5% per day.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#grace-period",
    popover: {
      title: "Grace Period",
      description:
        "Number of days after the due date before penalties start. Common grace periods are 3-7 days.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#save-button",
    popover: {
      title: "Save Your Configuration",
      description:
        'Always click "Save Configuration" after making changes! These settings affect how all future tenant bills are generated.',
      side: "top",
      align: "end",
    },
  },
  {
    popover: {
      title: "Configuration Complete! ✅",
      description:
        "Your property is now properly configured for billing. You can always return here to adjust settings as needed. Remember to save any changes!",
    },
  },
];
