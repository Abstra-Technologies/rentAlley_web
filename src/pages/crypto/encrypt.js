import CryptoJS from "crypto-js";

const secretKey = process.env.EMAIL_SECRET_KEY;

export const encryptEmail = (email) => {
  return CryptoJS.AES.encrypt(email, secretKey).toString();
};

export const decryptEmail = (encryptedEmail) => {
  const bytes = CryptoJS.AES.decrypt(encryptedEmail, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const encryptFName = (fname) => {
  return CryptoJS.AES.encrypt(fname, secretKey).toString();
};

export const encryptLName = (lname) => {
  return CryptoJS.AES.encrypt(lname, secretKey).toString();
};

export const encryptPhone = (phone) => {
  return CryptoJS.AES.encrypt(phone, secretKey).toString();
};

export const decryptData = (encryptedData) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8); // Convert bytes to string
};
