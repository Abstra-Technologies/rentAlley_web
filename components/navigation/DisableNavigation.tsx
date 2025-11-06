"use client";

import { useEffect } from "react";

/**
 * 🔒 Disable browser back/forward navigation while this component is mounted.
 *
 * Usage:
 *   <DisableNavigation />
 *
 * This prevents accidental navigation away from sensitive pages like forms.
 */
export default function DisableNavigation() {
    useEffect(() => {
        // Push a new state into the history stack
        window.history.pushState(null, "", window.location.href);

        // Prevent the back/forward navigation
        const handlePopState = () => {
            window.history.pushState(null, "", window.location.href);
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            // Clean up listener when component unmounts
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    return null; // nothing to render
}
