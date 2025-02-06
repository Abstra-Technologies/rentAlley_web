import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["upload.wikimedia.org"],
  },
};
// to decrypt data in useSession
module.exports = {
  env: {
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  },
};

export default nextConfig;
