"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Navbar from "../components/navigation/navbar";
import useAuthStore from "../zustand/authStore";
import Swal from "sweetalert2";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { fetchSession, user, admin } = useAuthStore();
    const user_id = user?.user_id ?? admin?.id;
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        if (!user && !admin) {
            fetchSession().catch((err: any) => {
                if (err.status === 401 || err.message.includes("expired")) {
                    setSessionExpired(true);
                    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
                } else {
                    console.error("Database connection error during session fetch:", err);
                }
            });
        }
    }, [user, admin, fetchSession]);

    useEffect(() => {
        if (sessionExpired) {
            Swal.fire({
                title: "Session Expired",
                text: "Your session has expired. Please log in again to continue.",
                icon: "warning",
                confirmButtonText: "Go to Login",
                customClass: {
                    container: "swal2-container",
                    popup: "rounded-lg p-4 max-w-[90%] sm:max-w-md",
                    title: "text-lg sm:text-xl font-semibold text-gray-800",
                    htmlContainer: "text-sm sm:text-base text-gray-600",
                    confirmButton: "bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto",
                },
                buttonsStyling: false,
                allowOutsideClick: false,
            }).then((result) => {
                if (result.isConfirmed) {
                    setSessionExpired(false);
                    window.location.href = "/pages/auth/login";
                }
            });
        }
    }, [sessionExpired]);



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
