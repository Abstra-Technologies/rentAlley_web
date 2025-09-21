
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

/**
 * Generate a DocuSign access token using JWT
 */
export async function getDocuSignToken() {
    // Make sure path works both in dev and prod
    const privateKeyPath = path.join(process.cwd(), "config", "private.key");
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");

    const now = Math.floor(Date.now() / 1000);

    const jwtPayload = {
        iss: process.env.DOCUSIGN_CLIENT_ID,               // Integration Key
        sub: process.env.DOCUSIGN_IMPERSONATED_USER_ID,    // User ID (GUID)
        aud: process.env.DOCUSIGN_AUTH_SERVER,             // "account-d.docusign.com" for demo
        iat: now,
        exp: now + 3600,                                   // 1 hour expiration
        scope: "signature impersonation",                  // Required for JWT
    };

    const jwtToken = jwt.sign(jwtPayload, privateKey, {
        algorithm: "RS256",
    });

    const res = await fetch(`https://${process.env.DOCUSIGN_AUTH_SERVER}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwtToken,
        }),
    });

    if (!res.ok) {
        const errorText = await res.text(); // Log real DocuSign error
        console.error("DocuSign token error:", errorText);
        throw new Error("Failed to get DocuSign access token");
    }

    const data = await res.json();

    return {
        accessToken: data.access_token,
        accountId: process.env.DOCUSIGN_ACCOUNT_ID!,
    };
}
