import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatAssetsId } from "@/utils/id_generator";

/**
 * Helper: builds a structured asset ID
 * e.g., property_id = "PROP01234" → UPKYPX4T901234
 */
function buildAssetId(property_id: string): string {
    const suffix = property_id.slice(-4);
    const baseId = generatAssetsId();
    return `${baseId}${suffix}`;
}

/* ===========================================================
   🟩 GET /api/landlord/assets?property_id=...
   Fetch all assets belonging to a property
   =========================================================== */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const property_id = searchParams.get("property_id");

        if (!property_id)
            return NextResponse.json({ error: "Missing property_id" }, { status: 400 });

        const [rows] = await db.query(
            `
        SELECT 
          a.asset_id,
          a.asset_name,
          a.category,
          a.model,
          a.manufacturer,
          a.status,
          a.warranty_expiry,
          a.unit_id,
          u.unit_name
        FROM rentalley_db.Asset a
        LEFT JOIN rentalley_db.Unit u ON a.unit_id = u.unit_id
        WHERE a.property_id = ?
        ORDER BY a.created_at DESC
      `,
            [property_id]
        );

        return NextResponse.json(rows);
    } catch (err: any) {
        console.error("❌ [GET Asset Error]", err);
        return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
    }
}

/* ===========================================================
   🟨 POST /api/landlord/assets
   Create a new asset (atomic + idempotent)
   =========================================================== */
export async function POST(req: NextRequest) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const data = await req.json();
        const {
            property_id,
            unit_id,
            asset_name,
            category,
            model,
            manufacturer,
            serial_number,
            description,
            purchase_date,
            warranty_expiry,
            status = "active",
            condition = "good",
        } = data;

        if (!property_id || !asset_name)
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

        // 🧩 IDEMPOTENCE: check if same asset exists (property + serial)
        const [existing]: any = await connection.query(
            `
        SELECT asset_id FROM rentalley_db.Asset
        WHERE property_id = ? AND asset_name = ? AND COALESCE(serial_number, '') = COALESCE(?, '')
        LIMIT 1
      `,
            [property_id, asset_name, serial_number || ""]
        );

        if (Array.isArray(existing) && existing.length > 0) {
            await connection.release();
            return NextResponse.json(
                { message: "Asset already exists", asset_id: existing[0].asset_id },
                { status: 200 }
            );
        }

        // 🔑 Generate new Asset ID
        const asset_id = buildAssetId(property_id);

        // 🧱 ATOMIC INSERT
        await connection.query(
            `
        INSERT INTO rentalley_db.Asset
        (asset_id, property_id, unit_id, asset_name, category, model, manufacturer, serial_number,
         description, purchase_date, warranty_expiry, status, \`condition\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                asset_id,
                property_id,
                unit_id || null,
                asset_name,
                category || null,
                model || null,
                manufacturer || null,
                serial_number || null,
                description || null,
                purchase_date || null,
                warranty_expiry || null,
                status,
                condition,
            ]
        );

        // ✅ COMMIT Transaction
        await connection.commit();
        await connection.release();

        return NextResponse.json({ message: "Asset created successfully", asset_id });
    } catch (err: any) {
        console.error("❌ [POST Asset Error]", err);
        await connection.rollback();
        await connection.release();
        return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
    }
}

/* ===========================================================
   🟦 PUT /api/landlord/assets
   Update an existing asset (atomic, parameterized)
   =========================================================== */
export async function PUT(req: NextRequest) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const data = await req.json();
        const { asset_id } = data;

        if (!asset_id)
            return NextResponse.json({ error: "Missing asset_id" }, { status: 400 });

        const fields = [
            "asset_name",
            "category",
            "model",
            "manufacturer",
            "serial_number",
            "description",
            "purchase_date",
            "warranty_expiry",
            "status",
            "condition",
            "unit_id",
        ];

        const updates = fields
            .filter((f) => data[f] !== undefined)
            .map((f) => `${f} = ?`)
            .join(", ");

        const values = fields.filter((f) => data[f] !== undefined).map((f) => data[f]);

        if (!updates)
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });

        await connection.query(
            `UPDATE rentalley_db.Asset 
       SET ${updates}, updated_at = CURRENT_TIMESTAMP
       WHERE asset_id = ?`,
            [...values, asset_id]
        );

        await connection.commit();
        await connection.release();

        return NextResponse.json({ message: "Asset updated successfully" });
    } catch (err: any) {
        console.error("❌ [PUT Asset Error]", err);
        await connection.rollback();
        await connection.release();
        return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
    }
}

/* ===========================================================
   🟥 DELETE /api/landlord/assets?asset_id=...
   Delete asset (atomic + safe)
   =========================================================== */
export async function DELETE(req: NextRequest) {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const { searchParams } = new URL(req.url);
        const asset_id = searchParams.get("asset_id");

        if (!asset_id)
            return NextResponse.json({ error: "Missing asset_id" }, { status: 400 });

        await connection.query(`DELETE FROM rentalley_db.Asset WHERE asset_id = ?`, [asset_id]);

        await connection.commit();
        await connection.release();

        return NextResponse.json({ message: "Asset deleted successfully" });
    } catch (err: any) {
        console.error("❌ [DELETE Asset Error]", err);
        await connection.rollback();
        await connection.release();
        return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
    }
}
