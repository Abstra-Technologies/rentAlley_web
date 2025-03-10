// File: /app/api/tenant/announcement/combined/route.js
import { db } from "../../../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userType = searchParams.get("userType");
    const tenantId = searchParams.get("tenantId");
    
    if (!userType) {
      return NextResponse.json(
        { error: "User type is required" },
        { status: 400 }
      );
    }

    // Get admin announcements visible to all users or specific to this user type
    const adminAnnouncements = await db.query(`
      SELECT 
        id, 
        title, 
        message, 
        created_at, 
        'admin' as source
      FROM AdminAnnouncement 
      WHERE user_type = 'all' OR user_type = ?
      ORDER BY created_at DESC
    `, [userType]);

    // For tenants, also get property-specific announcements if tenant ID is provided
    let landlordAnnouncements = [];
    if (userType === "tenant" && tenantId) {
      // Get the property ID through the chain: tenant -> lease agreement -> unit -> property
      const propertyQuery = await db.query(`
        SELECT p.property_id 
        FROM Property p
        JOIN Unit u ON u.property_id = p.property_id
        JOIN LeaseAgreement la ON la.unit_id = u.unit_id
        WHERE la.tenant_id = ? AND la.status = 'active'
        LIMIT 1
      `, [tenantId]);
      
      if (propertyQuery.length > 0) {
        const propertyId = propertyQuery[0].property_id;
        console.log("Found property for tenant:", propertyId);
        
        // Now get landlord announcements for this property
        landlordAnnouncements = await db.query(`
          SELECT 
            announcement_id as id, 
            subject as title, 
            description as message, 
            created_at,
            'landlord' as source
          FROM Announcement
          WHERE property_id = ?
          ORDER BY created_at DESC
        `, [propertyId]);
      } else {
        console.log("No active lease agreement found for tenant ID:", tenantId);
      }
    }

    // Combine and sort all announcements by date (newest first)
    const allAnnouncements = [...adminAnnouncements, ...landlordAnnouncements]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return NextResponse.json(allAnnouncements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}