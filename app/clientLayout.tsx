"use client";

import { useEffect } from "react";
import Script from "next/script";
import Navbar from "../components/navigation/navbar";
import useAuthStore from "../zustand/authStore";
// Web FCM
import { getToken, onMessage } from "firebase/messaging";
// @ts-ignore
import { messaging } from "../lib/firebase";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { fetchSession, user, admin } = useAuthStore();

    useEffect(() => {
        if (!user && !admin) {
            fetchSession();
        }
    }, [user, admin]);

    const user_id = user?.user_id ?? admin?.id;

    async function refreshFcmToken() {
        try {
            // @ts-ignore
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            if (currentToken) {
                await fetch("/api/save-fcm-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: currentToken }),
                });
            } else {
                console.log("⚠️ No FCM token, user might have blocked notifications");
            }
        } catch (err) {
            console.error("Error fetching FCM token", err);
        }
    }

    useEffect(() => {
        if (!user_id) return;

        const setupWebPush = async () => {
            if ("serviceWorker" in navigator) {
                try {
                    // Register service worker
                    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
                        scope: "/",
                    });

                    console.log("✅ SW registered:", registration);

                    // ✅ Use registration in getToken
                    // @ts-ignore
                    const token = await getToken(messaging, {
                        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                        serviceWorkerRegistration: registration,
                    });

                    if (token) {
                        console.log("📲 FCM Token:", token);
                    } else {
                        console.warn("⚠️ No registration token available. Request permission?");
                    }

                    // Listen for foreground messages
                    // @ts-ignore
                    onMessage(messaging, (payload) => {
                        console.log("📩 Message received in foreground:", payload);
                    });

                } catch (err) {
                    console.error("🔥 SW registration failed:", err);
                }
            }
        };


        refreshFcmToken();
        setupWebPush();
    }, [user_id]);

    // Google Maps injection
    useEffect(() => {
        const existingScript = document.getElementById("google-maps");
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places`;
            script.id = "google-maps";
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
    }, []);

    // Facebook SDK injection
    useEffect(() => {
        if (document.getElementById("facebook-jssdk")) return;

        const script = document.createElement("script");
        script.id = "facebook-jssdk";
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            // @ts-ignore
            window.FB?.init({
                appId: process.env.NEXT_PUBLIC_FB_APP_ID,
                autoLogAppEvents: true,
                xfbml: true,
                version: "v19.0",
            });
            console.log("✅ Facebook SDK initialized");
        };
    }, []);

    return (
        <>
            {/* Google Analytics */}
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
            <div id="fb-root"></div> {/* Needed for Facebook SDK */}
            <Navbar />
            {children}
        </>
    );
}
