export const landlordDashboardTourSteps = [
  // ─── WELCOME ───────────────────────────────────────────────────────────
  {
    popover: {
      title: "👋 Welcome to UpKyp!",
      description:
        "Let's take a quick tour so you know your way around. You can skip anytime by pressing Escape or the × button.",
      side: "over",
      align: "center",
    },
  },

  // ─── SIDEBAR BRAND ─────────────────────────────────────────────────────
  {
    element: "#nav-brand",
    popover: {
      title: "🏠 UpKyp",
      description:
        "This is your Landlord Portal. Click the logo anytime to return to your dashboard.",
      side: "right",
      align: "start",
    },
  },

  // ─── CORE NAV ──────────────────────────────────────────────────────────
  {
    element: "#nav-dashboard",
    popover: {
      title: "📊 Dashboard",
      description:
        "Your home base. Get a quick overview of payments, maintenance, occupancy, and revenue performance at a glance.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#nav-payments",
    popover: {
      title: "💳 Payments",
      description:
        "Track all rent payments, view transaction history, and monitor overdue balances across all your properties.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#nav-properties",
    popover: {
      title: "🏢 Properties",
      description:
        "Manage all your rental properties and units here — add new listings, update details, and view occupancy status.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#nav-tenants",
    popover: {
      title: "👥 My Tenants",
      description:
        "View and manage all your tenants. See their lease status, contact info, and payment history in one place.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#nav-messages",
    popover: {
      title: "💬 Messages",
      description:
        "Communicate directly with your tenants. All conversations are kept in one organized inbox.",
      side: "right",
      align: "start",
    },
  },

  // ─── OPERATIONS NAV ────────────────────────────────────────────────────
  {
    element: "#nav-workorders",
    popover: {
      title: "🔧 Work Orders",
      description:
        "Receive and manage maintenance requests from tenants. Assign work orders, track progress, and mark them resolved.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#nav-calendar",
    popover: {
      title: "📅 Booking Calendar",
      description:
        "View and manage visit appointment requests from tenants. When a tenant wants to check on a property unit, they set a date and time here for you to approve or decline.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#nav-announcements",
    popover: {
      title: "📢 Announcements",
      description:
        "Send announcements to all tenants or specific properties — great for maintenance notices, reminders, or updates.",
      side: "right",
      align: "start",
    },
  },

  // ─── FINANCE NAV ───────────────────────────────────────────────────────
  {
    element: "#nav-analytics",
    popover: {
      title: "📈 Analytics",
      description:
        "Dive deep into your revenue performance, collection rates, and property metrics to make smarter decisions.",
      side: "right",
      align: "start",
    },
  },

  // ─── DASHBOARD SECTIONS ────────────────────────────────────────────────
  {
    element: "#dashboard-header",
    popover: {
      title: "👤 Your Overview",
      description:
        "Your personalized greeting with today's date and time. A quick reminder of what's happening with your properties today.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#dashboard-setup-banner",
    popover: {
      title: "✅ Account Activation",
      description:
        "Complete these steps to fully activate your account — sign the platform agreement, verify your identity, connect your bank, and optionally add your first property.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#dashboard-quick-actions",
    popover: {
      title: "⚡ Quick Actions",
      description:
        "Shortcuts to your most common tasks — add a property, invite a tenant, post an announcement, create a work order, or go to payouts.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#dashboard-payment-summary",
    popover: {
      title: "💰 Payment Summary",
      description:
        "A snapshot of this month's rent collections — total collected, pending payments, and overdue amounts.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#dashboard-maintenance",
    popover: {
      title: "🔨 Maintenance Overview",
      description:
        "See pending maintenance requests at a glance. Click to go directly to your work orders.",
      side: "top",
      align: "start",
    },
  },
  {
    element: "#dashboard-occupancy",
    popover: {
      title: "🏠 Lease Occupancy",
      description:
        "Track how many of your units are occupied vs. vacant so you can act fast on empty units.",
      side: "top",
      align: "start",
    },
  },

  // ─── DONE ──────────────────────────────────────────────────────────────
  {
    popover: {
      title: "🎉 You're all set!",
      description:
        "That's the full tour! Start by completing your Account Activation steps, then add your first property. You can replay this tour anytime from the Help & Support section.",
      side: "over",
      align: "center",
    },
  },
];
