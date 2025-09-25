"use client";

import { useEffect } from "react";
import Script from "next/script";
import Navbar from "../components/navigation/navbar";
import useAuthStore from "../zustand/authStore";

// Helper: convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { fetchSession, user, admin } = useAuthStore();
    const user_id = user?.user_id ?? admin?.id;

    useEffect(() => {
        if (!user && !admin) fetchSession();
    }, [user, admin]);

    useEffect(() => {
        if (!user_id) return;

        const setupWebPush = async () => {
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                console.warn("🚫 Push not supported in this browser.");
                return;
            }
            try {
                // 1) Register service worker
                const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
                console.log("✅ SW registered:", registration);

                // 2) Ask for permission
                let permission = Notification.permission;
                if (permission === "default") {
                    permission = await Notification.requestPermission();
                }
                if (permission !== "granted") {
                    console.warn("🔕 Notifications not granted");
                    return;
                }

                // 3) Subscribe (reuse if already exists)
                const existing = await registration.pushManager.getSubscription();
                const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
                const appServerKey = urlBase64ToUint8Array(vapidKey);

                const subscription =
                    existing ||
                    (await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: appServerKey,
                    }));

                // 4) Save to backend if new
                const cacheKey = "push_endpoint";
                if (localStorage.getItem(cacheKey) !== subscription.endpoint) {
                    await fetch("/api/push/subscribe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: user_id,
                            subscription,
                            userAgent: navigator.userAgent,
                        }),
                    });
                    localStorage.setItem(cacheKey, subscription.endpoint);
                    console.log("📬 Subscription saved to backend");
                }
            } catch (err) {
                console.error("🔥 Web Push setup failed:", err);
            }
        };

        setupWebPush();
    }, [user_id]);

    return (
        <>
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

            <Script
                id="facebook-sdk"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
      window.fbAsyncInit = function() {
        FB.init({
          appId      : '${process.env.NEXT_PUBLIC_FB_APP_ID}', 
          cookie     : true,
          xfbml      : true,
          version    : 'v20.0' // latest stable Graph API version
        });
      };

      (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    `,
                }}
            />


            {/* ✅ Facebook SDK root */}
            <div id="fb-root"></div>

            <Navbar />
            {children}
        </>
    );
}
