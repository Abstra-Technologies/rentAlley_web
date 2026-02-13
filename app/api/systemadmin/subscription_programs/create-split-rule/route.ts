import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    let conn;

    try {
        const { plan_id, split_name, split_type, amount } =
            await req.json();

        /* ---------------------------------------------------- */
        /* VALIDATION                                           */
        /* ---------------------------------------------------- */

        if (!plan_id || !split_name || !split_type || !amount) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!["flat", "percent"].includes(split_type)) {
            return NextResponse.json(
                { error: "Invalid split_type" },
                { status: 400 }
            );
        }

        if (!process.env.XENDIT_PLATFORM_ACCOUNT_ID) {
            return NextResponse.json(
                { error: "Platform account ID not configured" },
                { status: 500 }
            );
        }

        if (!process.env.XENDIT_TEXT_SECRET_KEY) {
            return NextResponse.json(
                { error: "Xendit secret key not configured" },
                { status: 500 }
            );
        }

        conn = await db.getConnection();

        /* ---------------------------------------------------- */
        /* FETCH PLAN                                           */
        /* ---------------------------------------------------- */

        const [rows]: any = await conn.execute(
            `SELECT plan_id, name, split_rule_id 
             FROM Plan 
             WHERE plan_id = ? LIMIT 1`,
            [plan_id]
        );

        if (!rows.length) {
            return NextResponse.json(
                { error: "Plan not found" },
                { status: 404 }
            );
        }

        const plan = rows[0];

        if (plan.split_rule_id) {
            return NextResponse.json(
                { error: "Split rule already exists for this plan" },
                { status: 400 }
            );
        }

        /* ---------------------------------------------------- */
        /* BUILD ROUTE                                          */
        /* ---------------------------------------------------- */

        const route: any = {
            currency: "PHP",
            destination_account_id:
            process.env.XENDIT_PLATFORM_ACCOUNT_ID,
            reference_id: "platform",
        };

        if (split_type === "flat") {
            route.flat_amount = Number(amount);
        } else {
            route.percent_amount = Number(amount);
        }

        /* ---------------------------------------------------- */
        /* CREATE SPLIT RULE IN XENDIT                          */
        /* ---------------------------------------------------- */

        const response = await fetch(
            "https://api.xendit.co/split_rules",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            `${process.env.XENDIT_TEXT_SECRET_KEY}:`
                        ).toString("base64"),
                },
                body: JSON.stringify({
                    name: split_name.replace(/[^a-zA-Z0-9 ]/g, ""),
                    description: `Split rule for plan ${plan.name}`,
                    routes: [route],
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ SPLIT RULE ERROR", data);
            return NextResponse.json(
                {
                    error: "Failed to create split rule",
                    details: data,
                },
                { status: 500 }
            );
        }

        /* ---------------------------------------------------- */
        /* SAVE SPLIT RULE ID                                   */
        /* ---------------------------------------------------- */

        await conn.execute(
            `UPDATE Plan SET split_rule_id = ? WHERE plan_id = ?`,
            [data.id, plan_id]
        );

        return NextResponse.json({
            message: "Split rule created successfully",
            splitRuleId: data.id,
        });

    } catch (err: any) {
        console.error("💥 CREATE SPLIT RULE ERROR:", err);

        return NextResponse.json(
            { error: "Internal server error", details: err.message },
            { status: 500 }
        );
    } finally {
        if (conn) conn.release();
    }
}
