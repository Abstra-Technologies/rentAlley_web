import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteS3Object } from "@/lib/s3";
import { safeDecrypt } from "@/utils/decrypt/safeDecrypt";

export async function DELETE(req: NextRequest) {
    const conn = await db.getConnection();

    try {
        const { user_id, userType, admin_id } = await req.json();

        if (!user_id || !userType) {
            return NextResponse.json(
                { success: false, error: "Missing user_id, userType, or admin_id" },
                { status: 400 }
            );
        }

        await conn.beginTransaction();

        const s3Urls: string[] = [];

        /* =====================================================
           USER PROFILE (ENCRYPTED)
        ===================================================== */
        const [[user]]: any = await conn.query(
            `SELECT profilePicture FROM User WHERE user_id = ?`,
            [user_id]
        );

        const profileUrl = safeDecrypt(user?.profilePicture);
        if (profileUrl) s3Urls.push(profileUrl);

        /* =====================================================
           LANDLORD FLOW
        ===================================================== */
        if (userType === "landlord") {
            const [[landlord]]: any = await conn.query(
                `SELECT landlord_id FROM Landlord WHERE user_id = ?`,
                [user_id]
            );

            if (landlord?.landlord_id) {
                const landlordId = landlord.landlord_id;

                /* ---------- PROPERTY PHOTOS ---------- */
                const [propertyPhotos]: any[] = await conn.query(`
                    SELECT photo_url FROM PropertyPhoto
                    WHERE property_id IN (
                        SELECT property_id FROM Property WHERE landlord_id = ?
                    )
                `, [landlordId]);

                propertyPhotos.forEach(p => {
                    const url = safeDecrypt(p.photo_url);
                    if (url) s3Urls.push(url);
                });

                /* ---------- PROPERTY DOCUMENTS ---------- */
                const [documents]: any[] = await conn.query(`
                    SELECT file_url FROM PropertyDocument WHERE landlord_id = ?
                `, [landlordId]);

                documents.forEach(d => {
                    const url = safeDecrypt(d.file_url);
                    if (url) s3Urls.push(url);
                });

                /* ---------- PROPERTY VERIFICATION ---------- */
                const [verifications]: any[] = await conn.query(`
                    SELECT submitted_doc, gov_id, outdoor_photo, indoor_photo
                    FROM PropertyVerification
                    WHERE property_id IN (
                        SELECT property_id FROM Property WHERE landlord_id = ?
                    )
                `, [landlordId]);

                verifications.forEach(v => {
                    [v.submitted_doc, v.gov_id, v.outdoor_photo, v.indoor_photo].forEach(enc => {
                        const url = safeDecrypt(enc);
                        if (url) s3Urls.push(url);
                    });
                });

                /* ---------- ANNOUNCEMENTS ---------- */
                const [announcementPhotos]: any[] = await conn.query(`
                    SELECT ap.photo_url
                    FROM AnnouncementPhoto ap
                    JOIN Announcement a ON ap.announcement_id = a.announcement_id
                    WHERE a.landlord_id = ?
                `, [landlordId]);

                announcementPhotos.forEach(p => {
                    const url = safeDecrypt(p.photo_url);
                    if (url) s3Urls.push(url);
                });

                /* ---------- MAINTENANCE PHOTOS ---------- */
                const [maintenancePhotos]: any[] = await conn.query(`
                    SELECT mp.photo_url
                    FROM MaintenancePhoto mp
                    JOIN MaintenanceRequest mr ON mp.request_id = mr.request_id
                    WHERE mr.property_id IN (
                        SELECT property_id FROM Property WHERE landlord_id = ?
                    )
                `, [landlordId]);

                maintenancePhotos.forEach(p => {
                    const url = safeDecrypt(p.photo_url);
                    if (url) s3Urls.push(url);
                });

                /* ---------- UNIT QR (NOT ENCRYPTED) ---------- */
                const [unitQrs]: any[] = await conn.query(`
                    SELECT qr_code_url FROM Unit
                    WHERE property_id IN (
                        SELECT property_id FROM Property WHERE landlord_id = ?
                    )
                `, [landlordId]);

                unitQrs.forEach(u => {
                    if (u.qr_code_url) s3Urls.push(u.qr_code_url);
                });

                /* ---------- ASSETS ---------- */
                const [assets]: any[] = await conn.query(`
                    SELECT qr_code_url, image_urls, documents
                    FROM Asset
                    WHERE property_id IN (
                        SELECT property_id FROM Property WHERE landlord_id = ?
                    )
                `, [landlordId]);

                assets.forEach(a => {
                    // QR is NOT encrypted
                    if (a.qr_code_url) s3Urls.push(a.qr_code_url);

                    try {
                        JSON.parse(a.image_urls || "[]").forEach((enc: string) => {
                            const url = safeDecrypt(enc);
                            if (url) s3Urls.push(url);
                        });

                        JSON.parse(a.documents || "[]").forEach((enc: string) => {
                            const url = safeDecrypt(enc);
                            if (url) s3Urls.push(url);
                        });
                    } catch {}
                });

                /* ---------- LANDLORD DB DELETE ---------- */
                await conn.query(`DELETE FROM Property WHERE landlord_id = ?`, [landlordId]);
                await conn.query(`DELETE FROM Landlord WHERE landlord_id = ?`, [landlordId]);
            }
        }

        /* =====================================================
           TENANT FLOW
        ===================================================== */
        if (userType === "tenant") {
            const [[tenant]]: any = await conn.query(
                `SELECT tenant_id FROM Tenant WHERE user_id = ?`,
                [user_id]
            );

            if (tenant?.tenant_id) {
                const tenantId = tenant.tenant_id;

                const [moveInPhotos]: any[] = await conn.query(`
                    SELECT mp.file_url
                    FROM MoveInPhotos mp
                    JOIN MoveInItems mi ON mp.item_id = mi.item_id
                    JOIN MoveInChecklist mc ON mi.checklist_id = mc.checklist_id
                    JOIN LeaseAgreement la ON mc.agreement_id = la.agreement_id
                    WHERE la.tenant_id = ?
                `, [tenantId]);

                moveInPhotos.forEach(p => {
                    const url = safeDecrypt(p.file_url);
                    if (url) s3Urls.push(url);
                });

                await conn.query(`DELETE FROM LeaseAgreement WHERE tenant_id = ?`, [tenantId]);
                await conn.query(`DELETE FROM Tenant WHERE tenant_id = ?`, [tenantId]);
            }
        }

        /* =====================================================
           SHARED USER DATA
        ===================================================== */
        await conn.query(`DELETE FROM Message WHERE sender_id = ? OR receiver_id = ?`, [user_id, user_id]);
        await conn.query(`DELETE FROM Notification WHERE user_id = ?`, [user_id]);
        await conn.query(`DELETE FROM BugReport WHERE user_id = ?`, [user_id]);
        await conn.query(`DELETE FROM FCM_Token WHERE user_id = ?`, [user_id]);
        await conn.query(`DELETE FROM user_push_subscriptions WHERE user_id = ?`, [user_id]);
        await conn.query(`DELETE FROM UserToken WHERE user_id = ?`, [user_id]);

        /* =====================================================
           FINAL USER DELETE
        ===================================================== */
        await conn.query(`DELETE FROM User WHERE user_id = ?`, [user_id]);

        /* =====================================================
           DELETE S3 FILES
        ===================================================== */
        for (const url of s3Urls) {
            await deleteS3Object(url);
        }

        /* =====================================================
           ACTIVITY LOG
        ===================================================== */
        await conn.query(
            `
            INSERT INTO ActivityLog (
                admin_id,
                action,
                description,
                target_table,
                target_id,
                http_method,
                status_code
            ) VALUES (?, 'FORCE_DELETE_USER', ?, 'User', ?, 'DELETE', 200)
            `,
            [admin_id, `Admin force deleted ${userType} account`, user_id]
        );

        await conn.commit();

        return NextResponse.json({
            success: true,
            message: "Account and all related data permanently deleted.",
        });
    } catch (error) {
        await conn.rollback();
        console.error("❌ FORCE DELETE FAILED:", error);

        return NextResponse.json(
            { success: false, error: "Force delete failed. All changes rolled back." },
            { status: 500 }
        );
    } finally {
        conn.release();
    }
}
