import type { NextConfig } from "next";
import nextPwa from "next-pwa";

const baseConfig: NextConfig = {
    env: {
        ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
    },

    typescript: {
        ignoreBuildErrors: true,
    },

    // experimental: {
    //     allowedDevOrigins: [
    //         "http://localhost:3000",
    //         "https://appealing-rolland-nonprohibitorily.ngrok-free.dev",
    //     ],
    // },

    bundler: "webpack",

    /**
     * Silence turbopack auto-detection
     */
    turbopack: {},

    images: {
        remotePatterns: [
            { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/**" },
            {
                protocol: "https",
                hostname: "rentalley-bucket.s3.ap-southeast-1.amazonaws.com",
                pathname: "/**",
            },
            { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
            {
                protocol: "https",
                hostname: "encrypted-tbn0.gstatic.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "mir-s3-cdn-cf.behance.net",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "rentahanbucket.s3.us-east-1.amazonaws.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "cdn-icons-png.flaticon.com",
                pathname: "/**",
            },
            { protocol: "https", hostname: "photos.app.goo.gl" },
        ],
    },
};

const withPWA = nextPwa({
    dest: "public",
    register: true,
    sw: "sw.js",
    disable: process.env.NODE_ENV === "development",
});

export default withPWA(baseConfig);
