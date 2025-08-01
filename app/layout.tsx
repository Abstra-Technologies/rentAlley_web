import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./clientLayout";
import FeedbackWidget from "../components/feedback/FeedbackWidget";
import "leaflet/dist/leaflet.css";
import InstallPrompt from "@/components/Commons/installPrompt";
import Head from "next/head";
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Hestia Rent360",
    description: "Your App Description",
    manifest: '/manifest.json',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <Head>
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#ffffff" />
            <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        </Head>
        <body>
        <ClientLayout>
            {children}
            <InstallPrompt />

            {/* <FeedbackWidget /> */}
        </ClientLayout>
        </body>
        </html>
    );
}
