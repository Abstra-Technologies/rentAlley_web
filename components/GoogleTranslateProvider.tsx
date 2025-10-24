"use client";
import { useEffect } from "react";

declare global {
    interface Window {
        googleTranslateElementInit?: () => void;
    }
}

export default function GoogleTranslateProvider() {
    useEffect(() => {
        // Avoid re-adding script
        if (document.getElementById("google-translate-script")) return;

        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.src =
            "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        document.body.appendChild(script);

        window.googleTranslateElementInit = () => {
            new (window as any).google.translate.TranslateElement(
                {
                    pageLanguage: "en",
                    includedLanguages: "tl,es,zh,ja,fr,de,th", // ✅ with Thai included
                    autoDisplay: false,
                    layout: (window as any).google.translate.TranslateElement
                        .InlineLayout.SIMPLE,
                },
                "google_translate_element"
            );
        };
    }, []);

    return (
        <div
            id="google_translate_element"
            className="
        fixed bottom-4 right-4 z-[9999]
        flex items-center gap-2
        bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-500
        text-white font-medium text-sm
        px-3 py-2 rounded-full
        shadow-lg backdrop-blur-md
        hover:shadow-xl hover:scale-[1.03]
        transition-all duration-300 ease-in-out
        cursor-pointer
      "
        >
            <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                className='w-4 h-4 text-white animate-pulse'
            >
                <path d='M2 5h20M4 5v14a2 2 0 002 2h12a2 2 0 002-2V5M9 12h6m-3-3v6' />
            </svg>
            <span className="hidden sm:inline-block">Translate</span>
        </div>
    );
}
