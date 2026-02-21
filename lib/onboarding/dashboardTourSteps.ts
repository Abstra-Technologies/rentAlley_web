export const landlordDashboardTourSteps = [
  // ─── WELCOME ───────────────────────────────────────────────────────────
  {
    popover: {
      title: "",
      description: `
        <div style="margin: -12px -12px 0 -12px;">
          <!-- Gradient Header -->
          <div style="
            padding: 40px 24px 28px 24px;
            background: linear-gradient(135deg, #1d4ed8 0%, #0f766e 100%);
            text-align: center;
            border-radius: 14px 14px 0 0;
            position: relative;
          ">
            <div style="
              width: 72px;
              height: 72px;
              background: rgba(255,255,255,0.15);
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px auto;
              border: 1px solid rgba(255,255,255,0.25);
              padding: 10px;
            ">
              <img src="/upkeep_blue.png" alt="UpKyp" style="width: 100%; height: 100%; object-fit: contain; filter: brightness(0) invert(1);" />
            </div>
            <h2 style="
              color: #ffffff;
              font-size: 22px;
              font-weight: 800;
              margin: 0 0 6px 0;
              letter-spacing: -0.3px;
            ">Welcome to UpKyp!</h2>
            <p style="
              color: rgba(255,255,255,0.8);
              font-size: 13px;
              margin: 0;
            ">Your Landlord Portal is ready</p>
          </div>

          <!-- Body -->
          <div style="padding: 20px 20px 8px 20px; text-align: center;">
            <p style="
              color: #374151;
              font-size: 14px;
              line-height: 1.7;
              margin: 0 0 16px 0;
            ">
              UpKyp is your <strong>all-in-one property management platform</strong>.
              Manage properties, collect rent, communicate with tenants,
              track maintenance, and monitor your revenue — all in one place.
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 4px;">
              <div style="background: #eff6ff; border-radius: 10px; padding: 10px; font-size: 12px; color: #1d4ed8; font-weight: 600;">🏢 Properties</div>
              <div style="background: #ecfdf5; border-radius: 10px; padding: 10px; font-size: 12px; color: #0f766e; font-weight: 600;">💳 Payments</div>
              <div style="background: #faf5ff; border-radius: 10px; padding: 10px; font-size: 12px; color: #7c3aed; font-weight: 600;">👥 Tenants</div>
              <div style="background: #fff7ed; border-radius: 10px; padding: 10px; font-size: 12px; color: #c2410c; font-weight: 600;">🔧 Maintenance</div>
            </div>
          </div>
        </div>
      `,
      side: "over",
      align: "center",
      popoverClass: "driverjs-theme-upkyp driverjs-welcome",
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
