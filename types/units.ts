// types/unit.ts

/**
 * Shared Unit type used across tenant UI components
 * (cards, listings, portals).
 */
export interface Unit {
    unit_id: string;
    unit_name: string;
    unit_size: string;
    bed_spacing: number;
    avail_beds: number;
    rent_amount: number;
    furnish: string;
    status: string;

    // Initial payment fields
    sec_deposit: number;            // Security deposit amount
    advanced_payment: number;       // Advance payment amount
    is_advance_payment_paid: number;   // 0 = false, 1 = true
    is_security_deposit_paid: number;  // 0 = false, 1 = true

    // Media
    unit_photos: string[];

    // Property info
    property_name: string;
    property_type: string;
    city: string;
    province: string;
    street: string;
    zip_code: string;
    brgy_district: string;

    // Lease info
    agreement_id: string;
    start_date: string;
    end_date: string;
    has_pending_proof?: boolean;

    // Optional landlord info
    landlord_id?: string;
    landlord_name?: string;
}
