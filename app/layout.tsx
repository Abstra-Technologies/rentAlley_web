import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./clientLayout";
import FeedbackWidget from "../components/feedback/FeedbackWidget";
import "leaflet/dist/leaflet.css";
import InstallPrompt from "@/components/Commons/installPrompt";
import Head from "next/head";
import CookiesPermission from "@/components/Commons/setttings/cookiesPermission";
import PushInit from "@/components/notification/pushNotifMobile";
import GoogleTranslateProvider from "@/components/GoogleTranslateProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Upkyp",
    description: "Manage Less. Live More. Your Rental Management Partner",
    manifest: '/manifest.json',
    icons: {
        icon: '/upkeep_blue.png',
        apple: '/upkeep_blue.png'
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <Head>
            <link rel="manifest" href="/manifest.json"/>
            <meta name="theme-color" content="#ffffff"/>
            <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.matchMedia('(display-mode: standalone)').matches || 
                  navigator.standalone) {
                document.querySelector('meta[name="viewport"]').setAttribute(
                  'content',
                  'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
                );
              }
            `,
          }}
        />
           <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="apple-touch-icon" href="/Hestia-logo-b.svg"/>
        </Head>
        <body>
        <ClientLayout>

            {children}
            
            <CookiesPermission />
            {/*<GoogleTranslateProvider />*/}
            {/* <FeedbackWidget /> */}
        </ClientLayout>
        <InstallPrompt />
        </body>
        </html>
    );
}
