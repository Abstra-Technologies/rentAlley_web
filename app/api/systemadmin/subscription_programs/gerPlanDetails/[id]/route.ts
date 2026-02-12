import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/adminAuth";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: int }> }
) {
    const { id } = await context.params;

    try {
        // 🔐 Verify admin
        const auth = await verifyAdmin(request);

        if ("error" in auth) {
            return NextResponse.json(
                { success: false, message: auth.error },
                { status: auth.status }
            );
        }
        if (!id) {
            return NextResponse.json(
                { success: false, message: "Plan ID required" },
                { status: 400 }
            );
        }

        // 🔎 Fetch Plan
        const [planRows]: any = await db.query(
            `SELECT 
          plan_id,
          plan_code,
          name,
          price,
          billing_cycle,
          is_active,
          created_at,
          updated_at
       FROM Plan
       WHERE plan_id = ?
       LIMIT 1`,
            [id]
        );

        if (!planRows.length) {
            return NextResponse.json(
                { success: false, message: "Plan not found" },
                { status: 404 }
            );
        }

        const plan = planRows[0];

        // 🔎 Fetch Limits
        const [limitRows]: any = await db.query(
            `SELECT *
       FROM PlanLimits
       WHERE plan_id = ?
       LIMIT 1`,
            [id]
        );

        const limits = limitRows.length ? limitRows[0] : {};

        // 🔎 Fetch Features
        const [featureRows]: any = await db.query(
            `SELECT *
       FROM PlanFeatures
       WHERE plan_id = ?
       LIMIT 1`,
            [id]
        );

        const features = featureRows.length ? featureRows[0] : {};

        return NextResponse.json({
            plan,
            limits,
            features,
        });

    } catch (error) {
        console.error("ADMIN GET PLAN BY ID ERROR:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch plan details" },
            { status: 500 }
        );
    }
}


export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: int }> }
) {
    const connection = await db.getConnection();

    try {
        // ✅ Next 16 fix
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Plan ID required" },
                { status: 400 }
            );
        }

        // 🔐 Verify admin
        const auth = await verifyAdmin(request);
        if ("error" in auth) {
            return NextResponse.json(
                { success: false, message: auth.error },
                { status: auth.status }
            );
        }

        const body = await request.json();
        const { plan, limits, features } = body;

        if (!plan) {
            return NextResponse.json(
                { success: false, message: "Invalid request body" },
                { status: 400 }
            );
        }

        await connection.beginTransaction();

        // ==========================
        // UPDATE PLAN
        // ==========================
        await connection.query(
            `
      UPDATE Plan
      SET
        plan_code = ?,
        name = ?,
        price = ?,
        billing_cycle = ?,
        is_active = ?
      WHERE plan_id = ?
      `,
            [
                plan.plan_code,
                plan.name,
                Number(plan.price),
                plan.billing_cycle,
                plan.is_active,
                id,
            ]
        );

        // ==========================
        // UPDATE OR INSERT LIMITS
        // ==========================
        const [limitCheck]: any = await connection.query(
            `SELECT id FROM PlanLimits WHERE plan_id = ? LIMIT 1`,
            [id]
        );

        if (limitCheck.length) {
            await connection.query(
                `
        UPDATE PlanLimits
        SET
          max_properties = ?,
          max_units = ?,
          max_maintenance_request = ?,
          max_billing = ?,
          max_prospect = ?,
          max_storage = ?,
          max_assets_per_property = ?,
          financial_history_years = ?
        WHERE plan_id = ?
        `,
                [
                    limits.max_properties ?? null,
                    limits.max_units ?? null,
                    limits.max_maintenance_request ?? null,
                    limits.max_billing ?? null,
                    limits.max_prospect ?? null,
                    limits.max_storage ?? null,
                    limits.max_assets_per_property ?? null,
                    limits.financial_history_years ?? null,
                    id,
                ]
            );
        } else {
            await connection.query(
                `
        INSERT INTO PlanLimits (
          plan_id,
          max_properties,
          max_units,
          max_maintenance_request,
          max_billing,
          max_prospect,
          max_storage,
          max_assets_per_property,
          financial_history_years
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    id,
                    limits.max_properties ?? null,
                    limits.max_units ?? null,
                    limits.max_maintenance_request ?? null,
                    limits.max_billing ?? null,
                    limits.max_prospect ?? null,
                    limits.max_storage ?? null,
                    limits.max_assets_per_property ?? null,
                    limits.financial_history_years ?? null,
                ]
            );
        }

        // ==========================
        // UPDATE OR INSERT FEATURES
        // ==========================
        const [featureCheck]: any = await connection.query(
            `SELECT id FROM PlanFeatures WHERE plan_id = ? LIMIT 1`,
            [id]
        );

        if (featureCheck.length) {
            await connection.query(
                `
        UPDATE PlanFeatures
        SET
          reports = ?,
          pdc_management = ?,
          ai_unit_generator = ?,
          bulk_import = ?,
          announcements = ?,
          asset_management = ?,
          financial_insights = ?
        WHERE plan_id = ?
        `,
                [
                    features.reports ?? 0,
                    features.pdc_management ?? 0,
                    features.ai_unit_generator ?? 0,
                    features.bulk_import ?? 0,
                    features.announcements ?? 0,
                    features.asset_management ?? 0,
                    features.financial_insights ?? 0,
                    id,
                ]
            );
        } else {
            await connection.query(
                `
        INSERT INTO PlanFeatures (
          plan_id,
          reports,
          pdc_management,
          ai_unit_generator,
          bulk_import,
          announcements,
          asset_management,
          financial_insights
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
                [
                    id,
                    features.reports ?? 0,
                    features.pdc_management ?? 0,
                    features.ai_unit_generator ?? 0,
                    features.bulk_import ?? 0,
                    features.announcements ?? 0,
                    features.asset_management ?? 0,
                    features.financial_insights ?? 0,
                ]
            );
        }

        await connection.commit();
        connection.release();

        return NextResponse.json({
            success: true,
            message: "Plan updated successfully",
        });

    } catch (error) {
        await connection.rollback();
        connection.release();

        console.error("UPDATE PLAN ERROR:", error);

        return NextResponse.json(
            { success: false, message: "Failed to update plan" },
            { status: 500 }
        );
    }
}