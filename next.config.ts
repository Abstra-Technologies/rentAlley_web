import type { NextConfig } from "next";
import {getSecret} from "@/src/lib/getSecrets.mjs";

const nextConfig: NextConfig = {
  env: {
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
    DB_HOST: process.env.DB_HOST || "",
    DB_PASSWORD: process.env.DB_PASSWORD || "",
    DB_NAME: process.env.DB_NAME || "",
    DB_PORT: process.env.DB_PORT || "",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
    EMAIL_USER: process.env.EMAIL_USER || "",
    EMAIL_PASS: process.env.EMAIL_PASS || "",
    JWT_SECRET: process.env.JWT_SECRET || "",
    // NODE_ENV: process.env.NODE_ENV || "",
    Public_Key: process.env.Public_Key || "",
    Private_Key: process.env.Private_Key || "",
    RESET_TOKEN_SECRET: process.env.RESET_TOKEN_SECRET || "",
    SUPER_ADMIN_EMAIL_1: process.env.SUPER_ADMIN_EMAIL_1 || "",
    SUPER_ADMIN_PASS_1: process.env.SUPER_ADMIN_PASS_1 || "",
    REDIRECT_URI: process.env.REDIRECT_URI || "",
    REDIRECT_URI_SIGNIN: process.env.REDIRECT_URI_SIGNIN || "",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || "",
    AWS_REGION: process.env.AWS_REGION || "",
    MAYA_PUBLIC_KEY: process.env.MAYA_PUBLIC_KEY || "",
    MAYA_SECRET_KEY: process.env.MAYA_SECRET_KEY || "",
    CHAT_ENCRYPTION_SECRET: process.env.CHAT_ENCRYPTION_SECRET || "",
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
    GOOGLE_ANALYTICS_CLIENT_EMAIL: process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL || "",
    GOOGLE_ANALYTICS_PRIVATE_KEY: process.env.GOOGLE_ANALYTICS_PRIVATE_KEY || "",
    GOOGLE_ANALYTICS_PROPERTY_ID: process.env.GOOGLE_ANALYTICS_PROPERTY_ID || "",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      "upload.wikimedia.org",
      "rentahanbucket.s3.us-east-1.amazonaws.com",
      "lh3.googleusercontent.com",
      "encrypted-tbn0.gstatic.com",
      "mir-s3-cdn-cf.behance.net",

    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rentahanbucket.s3.us-east-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
