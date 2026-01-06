/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                adminBlue: "#1c638b",
            },
            fontFamily: {
                league: ["'League Spartan'", "sans-serif"],
            },
        },
    },
    plugins: [],
};
