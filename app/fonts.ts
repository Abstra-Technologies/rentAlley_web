// app/fonts.ts
import localFont from "next/font/local";

export const upkypFont = localFont({
    src: [
        { path: "../public/fonts/league-spartan.bold.otf", weight: "400" },

    ],
    variable: "--font-upkyp",
    display: "swap",
});
