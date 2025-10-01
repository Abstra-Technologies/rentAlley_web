import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// @ts-ignore
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const landlordId = searchParams.get('landlord_id');

    if (!landlordId) {
        return NextResponse.json(
            { error: 'Landlord ID is required' },
            { status: 400 }
        );
    }

    try {
        const [rows] = await db.query(
            `
      SELECT la.agreement_id, la.end_date, u.unit_name, p.property_name
      FROM LeaseAgreement la
      JOIN Unit u ON la.unit_id = u.unit_id
      JOIN Property p ON u.property_id = p.property_id
      WHERE p.landlord_id = ? AND la.status = 'active'
      `,
            [landlordId]
        );

        const leasesWithDays = rows.map(lease => {
            const endDate = new Date(lease.end_date);
            const today = new Date();
            const diffTime = endDate - today;
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { ...lease, daysRemaining };
        });

        return NextResponse.json(leasesWithDays, { status: 200 });
    } catch (err) {
        console.error('Database query failed:', err);
        return NextResponse.json(
            { error: 'Failed to fetch lease data due to a database connection error' },
            { status: 500 }
        );
    }
}