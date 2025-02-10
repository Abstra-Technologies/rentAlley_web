import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  },
  images: {
    domains: [
      "upload.wikimedia.org",
      "rentahanbucket.s3.us-east-1.amazonaws.com",
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