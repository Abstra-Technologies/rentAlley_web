import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  },
  api: {
    bodyParser: {
      sizeLimit: "25mb", // ✅ Increase API body limit
    },
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
