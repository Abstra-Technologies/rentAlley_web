import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const landlord_id = searchParams.get("landlord_id");

    if (!landlord_id) {
      return NextResponse.json({ error: "Invalid request, missing landlord_id" }, { status: 400 });
    }

    const [rows] = await db.query(
      "SELECT plan_name, start_date, end_date, payment_status, is_trial, is_active FROM Subscription WHERE landlord_id = ? AND is_active = 1",
      [landlord_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    let subscription = rows[0];
    const currentDate = new Date();
    const subscriptionEndDate = subscription.end_date ? new Date(subscription.end_date) : null;

    // Mark as inactive if expired
    if (subscriptionEndDate && subscriptionEndDate < currentDate && subscription.is_active === 1) {
      await db.query("UPDATE Subscription SET is_active = 0 WHERE landlord_id = ?", [landlord_id]);
      subscription.is_active = 0;
    }

    return NextResponse.json(subscription, { status: 200 });

  } catch (error) {
    console.error("Database query error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
