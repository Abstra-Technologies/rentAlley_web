export const propertyUnitsTourSteps = [
  // ─── WELCOME ───────────────────────────────────────────────────────────
  {
    popover: {
      title: "",
      description: `
        <div style="margin: -12px -12px 0 -12px;">
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
            <h2 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.3px;">Property Management</h2>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0;">Let's walk you through your property</p>
          </div>
          <div style="padding: 20px 20px 8px 20px; text-align: center;">
            <p style="color: #374151; font-size: 14px; line-height: 1.7; margin: 0 0 16px 0;">
              This is your <strong>property management hub</strong>. From here you can manage units, handle leases, track payments, and configure everything for this property.
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 4px;">
              <div style="background: #eff6ff; border-radius: 10px; padding: 10px; font-size: 12px; color: #1d4ed8; font-weight: 600;">🏠 Units</div>
              <div style="background: #ecfdf5; border-radius: 10px; padding: 10px; font-size: 12px; color: #0f766e; font-weight: 600;">📋 Leases</div>
              <div style="background: #faf5ff; border-radius: 10px; padding: 10px; font-size: 12px; color: #7c3aed; font-weight: 600;">💳 Billing</div>
              <div style="background: #fff7ed; border-radius: 10px; padding: 10px; font-size: 12px; color: #c2410c; font-weight: 600;">📊 Financials</div>
            </div>
          </div>
        </div>
      `,
      side: "over",
      align: "center",
      popoverClass: "driverjs-theme-upkyp driverjs-welcome",
    },
  },

  // ─── PROPERTY SETUP NAV ────────────────────────────────────────────────
  {
    element: "#prop-nav-units",
    popover: {
      title: "🏠 Units",
      description:
        "Your default view. Add, edit, and manage all units under this property. You can also bulk import units or invite tenants directly from here.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#prop-nav-edit",
    popover: {
      title: "✏️ Edit Property",
      description:
        "Update your property details — name, address, type, amenities, description, and photos.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#prop-nav-policy",
    popover: {
      title: "📋 House Policy",
      description:
        "Write and save the house rules and guidelines for this property using the rich text editor. Tenants currently renting in this property will be able to see these rules. Supports formatting like bold, italic, bullet lists, and more.",
      side: "right",
      align: "start",
    },
  },

  // ─── OPERATIONS NAV ────────────────────────────────────────────────────
  {
    element: "#prop-nav-active-lease",
    popover: {
      title: "📜 Active Lease",
      description:
        "See all active lease agreements with stats for Total, Active (Healthy), Expiring (Action required), and Pending (Awaiting tenant). Each record shows the unit, tenant, start/end dates, status, and EKYP ID. Use Go to Billing or View Payments at the top to jump directly to related pages.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#prop-nav-prospectives",
    popover: {
      title: "👥 Prospectives",
      description:
        "Manage tenants who applied for units in this property. View Active and Archived applicants with their contact details, assigned unit, and approval status. Click View on any applicant to see their AI-powered Tenant Screening Report — showing Rental History, Payment Reliability, Profile Completeness scores, overall applicant grade, submitted documents, and Application Decision.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#prop-nav-assets",
    popover: {
      title: "🔧 Assets",
      description:
        "Track all physical assets for this property. Filter by All, Property-level, or Unit-assigned assets. Each asset record includes name, category, model, warranty, and status. Click Add Asset to log a new item — enter the name, category, model, manufacturer, serial number, images, purchase date, warranty expiry, condition, status, and optionally assign it to a specific unit.",
      side: "right",
      align: "start",
    },
  },

  // ─── FINANCE NAV ───────────────────────────────────────────────────────
  {
    element: "#prop-nav-billing",
    popover: {
      title: "💳 Billing",
      description:
        "View billing stats across all units — total units, units with/without bills, paid count, total amount due, and billing completion. Use Set Rates to configure utility rates (electricity and water) by entering the concessionaire's total consumption and amount — the per-unit rate is computed automatically. Click Open on any bill to manage it.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#prop-nav-payments",
    popover: {
      title: "💰 Payments",
      description:
        "Complete payment history for this property. Shows each transaction's tenant, unit, payment type, amount, method, status, and date paid. Use the column filters and view toggles to sort and organize records.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#prop-nav-pdc-management",
    popover: {
      title: "🧾 PDC Management",
      description:
        "Manage post-dated checks submitted by tenants. Filter by All, Pending, Cleared, Bounced, or Replaced. Each record shows the check number, bank, tenant, unit, amount, issue date, and status. Use Upload PDCs to add new check records.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#prop-nav-finance",
    popover: {
      title: "📊 Financials",
      description:
        "Track your property's financial performance. See Gross Operating Income (GOI) and Net Operating Income (NOI) broken down by Month-to-Month, Year-to-Date, and Year-over-Year — with monthly trend charts for each.",
      side: "right",
      align: "start",
    },
  },

  // ─── UTILITIES & SETTINGS NAV ──────────────────────────────────────────
  {
    element: "#prop-nav-utilities",
    popover: {
      title: "⚡ Utilities",
      description:
        "View historical utility costs for this property. Shows total water consumption (m³) and electricity consumption (kWh) at a glance. The table breaks down each billing period's water volume, water rate, water total, electricity consumption, electricity rate, and electricity total. Filter by Water or Electricity using the top-right toggle.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#prop-nav-configuration",
    popover: {
      title: "⚙️ Configuration",
      description:
        "Control property-level billing rules in three sections. Property Notifications — set the reminder day, billing due date (day of month), and notification channels (Email/SMS). Utility Billing — choose the billing type for water and electricity (e.g. Submetered). Late Payment Penalty — configure penalty type (fixed or percentage), penalty application (one-time or per day), penalty amount, and grace period in days.",
      side: "right",
      align: "start",
    },
  },

  // ─── UNITS PAGE SECTIONS ───────────────────────────────────────────────
  {
    element: "#units-header",
    popover: {
      title: "🏠 Unit Overview",
      description:
        "This is the main units page for this property. You can add units manually, bulk import them, or invite a tenant directly.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#units-action-buttons",
    popover: {
      title: "⚡ Unit Actions",
      description:
        "Add a single unit, bulk import multiple units at once, or invite a tenant directly to a specific unit.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#units-list",
    popover: {
      title: "📋 Units List",
      description:
        "All your units are listed here with their rent amount and publish status. Toggle a unit between Published (visible to tenants in the listing) and Hidden (not visible). Click View to see the unit's Meter readings, Analytics, and Lease History.",
      side: "top",
      align: "start",
    },
  },

  // ─── DONE ──────────────────────────────────────────────────────────────
  {
    popover: {
      title: "🎉 You're ready!",
      description:
        "You now know your way around this property. Start by adding your first unit, then set up billing and invite a tenant. Click the Show Guide button anytime to replay this tour.",
      side: "over",
      align: "center",
    },
  },
];
