'use client';
// import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../../src/components/navigation/navbar";
import { usePathname } from "next/navigation";
import {useEffect} from "react";
import {initGA, logPageView} from "@/src/utils/gtag";
import Script from "next/script";


const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// export const metadata: Metadata = {
//     title: "Rentahan",
//     description: "Real Estate Web Application",
// };

// eslint-disable-next-line @typescript-eslint/ban-ts-comment

// export default function RootLayout({ children }) {
//     return (
//         <html lang="en">
//         <head>
//             {/* Google Analytics Script */}
//             <Script
//                 strategy="afterInteractive"
//                 src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
//             />
//             <Script
//                 id="google-analytics"
//                 strategy="afterInteractive"
//                 dangerouslySetInnerHTML={{
//                     __html: `
//               window.dataLayer = window.dataLayer || [];
//               function gtag(){dataLayer.push(arguments);}
//               gtag('js', new Date());
//               gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
//                 page_path: window.location.pathname,
//               });
//             `,
//                 }}
//             /><title></title>
//         </head>
//         <body className="antialiased">
//         <Navbar />
//         {children}
//         </body>
//         </html>
//     );
// }

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className="antialiased">
        {/* Google Analytics Script */}
        <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
        />
        <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
                __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `,
            }}
        />

        <Navbar />
        {children}
        </body>
        </html>
    );
}