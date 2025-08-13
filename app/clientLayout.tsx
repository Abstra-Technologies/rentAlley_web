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

   useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

   const user_id = user?.user_id;

    useEffect(() => {
        if (!user?.user_id) return;
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                // @ts-ignore
                getToken(messaging, { vapidKey: "BA1lJSSud0mm0aBsNycy4wW0Q7uzfS7MDYaXnNGZIxf7XrO4kpqb2u7-1cwVSn8DxO___OVEcA_34r1kmXEHwSI" })
                    .then((currentToken) => {
                        if (currentToken) {// Send token to backend
                            fetch("/api/auth/save-fcm-token", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    token: currentToken,
                                    userId: user_id, // or admin?.id
                                    platform: "web"

                                }),
                            });
                        }
                    })
                    .catch((err) => console.log("Error getting token:", err));
            }
        });

        // @ts-ignore
        onMessage(messaging, (payload) => {
            console.log("Message received in foreground:", payload);
            // optionally show notification UI here
        });
    }, [user]);

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
            <Navbar />
            {children}
        </>
    );
}
