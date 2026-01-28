import crypto from "crypto";

/**
 * SHA256(full lowercase name)
 * Used for exact full-name search
 */
export function generateNameHash(
    firstName = "",
    lastName = ""
): string | null {
    const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
    if (!fullName) return null;

    return crypto.createHash("sha256").update(fullName).digest("hex");
}

/**
 * SHA256 tokens of lowercase name parts
 * Used for partial search (JSON_CONTAINS)
 */
export function generateNameTokens(
    firstName = "",
    lastName = ""
): string | null {
    const tokens = `${firstName} ${lastName}`
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

    if (!tokens.length) return null;

    return JSON.stringify(
        [...new Set(tokens)].map((t) =>
            crypto.createHash("sha256").update(t).digest("hex")
        )
    );
}
