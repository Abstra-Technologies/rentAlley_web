
import crypto from "crypto";

const algorithm = "aes-256-gcm"; // AES-GCM with 256-bit key
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Derives a 32-byte encryption key from a secret passphrase using PBKDF2.
 */
const getKey = (secret) => {
    return crypto.pbkdf2Sync(secret, "unique_salt", 100000, 32, "sha256");
};

/**
 * Encrypts data using AES-256-GCM
 */
export const encryptData = (data, secret) => {
    const key = getKey(secret);
    const iv = crypto.randomBytes(12); // Generate a random IV
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
        iv: iv.toString("hex"),
        data: encrypted,
        authTag: cipher.getAuthTag().toString("hex"),
    };
};

// export const decryptData = (encryptedData, secret) => {
//     try {
//         if (!encryptedData || typeof encryptedData !== "object" || !encryptedData.iv || !encryptedData.data || !encryptedData.authTag) {
//             console.warn("⚠️ DecryptData received invalid or undefined input:", encryptedData);
//             return "";
//         }
//
//         const key = getKey(secret);
//         const iv = Buffer.from(encryptedData.iv, "hex");
//         const encryptedText = encryptedData.data;
//         const authTag = Buffer.from(encryptedData.authTag, "hex");
//
//         const decipher = crypto.createDecipheriv(algorithm, key, iv);
//         decipher.setAuthTag(authTag);
//
//         let decrypted = decipher.update(encryptedText, "hex", "utf8");
//         decrypted += decipher.final("utf8");
//
//         return decrypted;
//     } catch (error) {
//         console.error("❌ Error decrypting data:", error.message);
//         return "";
//     }
// };


// export const decryptData = (encryptedData, secret) => {
//     const key = getKey(secret);
//     const iv = Buffer.from(encryptedData.iv, "hex");
//     const encryptedText = encryptedData.data;
//     const authTag = Buffer.from(encryptedData.authTag, "hex");
//
//     const decipher = crypto.createDecipheriv(algorithm, key, iv);
//     decipher.setAuthTag(authTag);
//
//     let decrypted = decipher.update(encryptedText, "hex", "utf8");
//     decrypted += decipher.final("utf8");
//
//     return decrypted;
// };
//
//


export const decryptData = (encryptedData, secret) => {
    try {
        console.log("Encrypted data received:", encryptedData);

        if (!encryptedData.iv || !encryptedData.data || !encryptedData.authTag) {
             new Error("Invalid encrypted data format");
        }

        const key = getKey(secret);
        const iv = Buffer.from(encryptedData.iv, "hex");
        const encryptedText = Buffer.from(encryptedData.data, "hex"); // FIXED
        const authTag = Buffer.from(encryptedData.authTag, "hex");

        console.log("Derived key:", key.toString("hex"));
        console.log("Algorithm used:", algorithm);

        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText);
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("Error decrypting user data:", error);
        return null;
    }
};
