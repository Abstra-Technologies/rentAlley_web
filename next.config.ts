import type { NextConfig } from "next";
import nextPwa from "next-pwa";

const baseConfig: NextConfig = {
    env: {
        ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
    },

    typescript: {
        ignoreBuildErrors: true,
    },

    bundler: "webpack",

    /**
     * Silence turbopack auto-detection
     */
    turbopack: {},

    /**
     * 🔐 Security Headers (GLOBAL)
     */
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },

                    // ✅ Recommended modern headers
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                ],
            },
        ];
    },

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
            { protocol: "https", hostname: "res.cloudinary.com" },
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
