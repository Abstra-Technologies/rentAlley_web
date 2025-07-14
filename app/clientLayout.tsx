"use client";

import { useEffect } from "react";
import Script from "next/script";
import Navbar from "../components/navigation/navbar";
import useAuthStore from "../zustand/authStore";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { fetchSession, user, admin } = useAuthStore();

   useEffect(() => {
    // Fetch session only if user/admin is not already available
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);
  
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
