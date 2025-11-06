import crypto from "crypto";

/**
 * Decrypts an AES-256-CBC encrypted chat message using the CHAT_ENCRYPTION_SECRET.
 * @param encryptedMessage The encrypted message text (hex encoded)
 * @param iv The initialization vector (hex encoded)
 * @returns The decrypted UTF-8 message or a fallback string
 */
export function decryptChatMessage(encryptedMessage: string, iv: string): string {
    if (!encryptedMessage || !iv) return "[No Message]";

    try {
        const secret = process.env.CHAT_ENCRYPTION_SECRET;
        if (!secret) {
            console.error("Missing CHAT_ENCRYPTION_SECRET in environment variables");
            return "[Missing Secret]";
        }

        const key = crypto.createHash("sha256").update(secret).digest();
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(iv, "hex"));

        let decrypted = decipher.update(encryptedMessage, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (err) {
        console.error("Chat message decryption error:", err);
        return "[Decryption Error]";
    }
}
