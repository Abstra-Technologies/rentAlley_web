'use client';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../../src/components/navigation/navbar";
import { usePathname } from "next/navigation";
import {useEffect} from "react";
import {initGA, logPageView} from "@/src/pages/utils/gtag";
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

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
            initGA();
            logPageView();
        }
    }, [pathname]);
    return (
        <html lang="en">
        <head>
            <>
                {/* Google Analytics Tag */}
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
                {children}
            </>
            <title></title></head>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <Navbar/>
        {children}
        </body>
        </html>
    );
}
