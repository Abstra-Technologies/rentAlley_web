import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Define listing limits per plan
const listingLimits = {
  "Free Plan": {
    maxProperties: 1,
    maxUnits: 2,
    maxMaintenanceRequest: 5,
    maxReports: 3,
    maxBilling: 2,
    maxProspect: 3,
  },
  "Standard Plan": {
    maxProperties: 5,
    maxUnits: 2,
    maxMaintenanceRequest: 10,
    maxReports: Infinity,
    maxBilling: 10,
    maxProspect: 10,
  },
  "Premium Plan": {
    maxProperties: 20,
    maxUnits: 50,
    maxMaintenanceRequest: Infinity,
    maxReports: Infinity,
    maxBilling: Infinity,
    maxProspect: Infinity,
  },
};

export async function GET(req: NextRequest, { params }) {
  const { landlord_id } = params;

  if (!landlord_id) {
    return NextResponse.json(
      { error: "Missing landlord_id" },
      { status: 400 }
    );
  }

  try {
    const [rows] = await db.query(
      `SELECT plan_name, start_date, end_date, payment_status, is_trial, is_active
       FROM Subscription
       WHERE landlord_id = ? AND is_active = 1`,
      [landlord_id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    let subscription = rows[0];
    const currentDate = new Date();
    const endDate = subscription.end_date ? new Date(subscription.end_date) : null;

    if (endDate && endDate < currentDate && subscription.is_active === 1) {
      await db.query(
        "UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?",
        [landlord_id]
      );
      subscription.is_active = 0;
    }

    const limits = listingLimits[subscription.plan_name] || {};
    subscription.listingLimits = limits;

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Database query error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
