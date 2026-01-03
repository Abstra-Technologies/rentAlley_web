import { decryptData } from "@/crypto/encrypt";
//  utils to decrupt encyrpted data.

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET!;

export const safeDecrypt = (
    value?: string | null
): string | null => {
    if (!value) return null;

    try {
        return decryptData(JSON.parse(value), ENCRYPTION_SECRET);
    } catch {
        return null;
    }
};
