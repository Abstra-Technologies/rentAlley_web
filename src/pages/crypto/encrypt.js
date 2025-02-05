// import CryptoJS from "crypto-js";
//
// const secretKey = process.env.EMAIL_SECRET_KEY;
//
// export const encryptEmail = (email) => {
//   return CryptoJS.AES.encrypt(email, secretKey).toString();
// };
//
// export const decryptEmail = (encryptedEmail) => {
//   const bytes = CryptoJS.AES.decrypt(encryptedEmail, secretKey);
//   return bytes.toString(CryptoJS.enc.Utf8);
// };
//
// export const encryptFName = (fname) => {
//   return CryptoJS.AES.encrypt(fname, secretKey).toString();
// };
//
// export const encryptLName = (lname) => {
//   return CryptoJS.AES.encrypt(lname, secretKey).toString();
// };
//
// export const encryptPhone = (phone) => {
//   return CryptoJS.AES.encrypt(phone, secretKey).toString();
// };
//
// export const decryptData = (encryptedData) => {
//   const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
//   return bytes.toString(CryptoJS.enc.Utf8); // Convert bytes to string
// };

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

/**
 * Decrypts data using AES-256-GCM
 */
export const decryptData = (encryptedData, secret) => {
    const key = getKey(secret);
    const iv = Buffer.from(encryptedData.iv, "hex");
    const encryptedText = encryptedData.data;
    const authTag = Buffer.from(encryptedData.authTag, "hex");

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
};
