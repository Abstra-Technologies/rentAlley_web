import crypto from "crypto";

function randomAlphaNumeric(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
    }
    return result;
}


export function generatePropertyId(): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `UPKYP${random}`;
}

export function generateUnitId(): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `UPKYU${random}`;
}

export function generateLandlordId(): string {
    return "UPKYPL" + randomAlphaNumeric(10);
}

export function generateTenantId(): string {
    return "UPKYPT" + randomAlphaNumeric(10);
}

export function generateProspectiveTenantId(): string {
    return "UPKYPPT" + randomAlphaNumeric(10);
}

export function generateLeaseId(): string {
    return "UPKYPL" + randomAlphaNumeric(10);
}

export function generateBillId(): string {
    return "UPKYPBILL" + randomAlphaNumeric(6);
}

export function generateMaintenanceId(): string {
    return "UPKYPBILL" + randomAlphaNumeric(4);
}

export function generatAssetsId(): string {
    return "UPKY" + randomAlphaNumeric(4);
}