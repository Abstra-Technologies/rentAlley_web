"use client";

import { useEffect } from "react";
import Script from "next/script";
import Navbar from "../components/navigation/navbar";
import useAuthStore from "../zustand/authStore";
import { getToken, onMessage } from "firebase/messaging";
// @ts-ignore
import { messaging } from "../lib/firebase";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { fetchSession, user, admin } = useAuthStore();
    const user_id = user?.user_id ?? admin?.id;

    // Save token to backend only if it's new
    async function saveFcmToken(token: string) {
        try {
            const storedToken = localStorage.getItem("fcm_token");
            if (storedToken === token) return; // ✅ Already saved, no need

            await fetch("/api/auth/save-fcm-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            localStorage.setItem("fcm_token", token);
            console.log("✅ Token saved to backend:", token);
        } catch (err) {
            console.error("Error saving FCM token", err);
        }
    }

    async function fetchAndSaveToken(registration?: ServiceWorkerRegistration) {
        try {
            // @ts-ignore
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration,
            });

            if (currentToken) {
                console.log("📲 Current FCM Token:", currentToken);
                await saveFcmToken(currentToken);
            } else {
                console.warn("⚠️ No registration token available. Ask user for permission?");
            }
        } catch (err) {
            console.error("Error fetching FCM token", err);
        }
    }

    useEffect(() => {
        if (!user && !admin) {
            fetchSession();
        }
    }, [user, admin]);

    useEffect(() => {
        if (!user_id) return;

        const setupWebPush = async () => {
            if ("serviceWorker" in navigator) {
                try {
                    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
                        scope: "/",
                    });

                    console.log("✅ SW registered:", registration);

                    // Fetch token immediately
                    await fetchAndSaveToken(registration);

                    // Re-fetch token when service worker becomes active again (browser restarts, etc.)
                    navigator.serviceWorker.addEventListener("controllerchange", () => {
                        console.log("🔄 SW controller changed, refreshing token...");
                        fetchAndSaveToken(registration);
                    });

                    // Foreground messages
                    // @ts-ignore
                    onMessage(messaging, (payload) => {
                        console.log("📩 Message received in foreground:", payload);
                    });
                } catch (err) {
                    console.error("🔥 SW registration failed:", err);
                }
            }
        };

        setupWebPush();

        // 🔄 Periodically refresh token (e.g., every 24h)
        const interval = setInterval(() => {
            console.log("⏰ Periodic FCM token refresh...");
            fetchAndSaveToken();
        }, 24 * 60 * 60 * 1000); // once a day

        return () => clearInterval(interval);
    }, [user_id]);

    // (Google Maps + Facebook SDK unchanged...)
    // ...

    return (
        <>
            <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} />
            <Script id="google-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{
                __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `,
            }} />
            <div id="fb-root"></div>
            <Navbar />
            {children}
        </>
    );
}
