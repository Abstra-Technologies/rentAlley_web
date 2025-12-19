"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const words = [
    "Apartments",
    "Office Spaces",
    "Warehouses",
    "Commercial Properties",
    "Dormitories",
    "Duplex",
    "townhouses",
];

export default function HeroTypewriter() {
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = textRef.current;
        if (!el) return;

        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        const typeSpeed = 0.06;
        const deleteSpeed = 0.04;
        const holdDelay = 1.4;

        const type = () => {
            const currentWord = words[wordIndex];
            const text = isDeleting
                ? currentWord.substring(0, charIndex--)
                : currentWord.substring(0, charIndex++);

            el.textContent = text;

            if (!isDeleting && charIndex === currentWord.length) {
                gsap.delayedCall(holdDelay, () => (isDeleting = true));
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
            }

            gsap.delayedCall(isDeleting ? deleteSpeed : typeSpeed, type);
        };

        type();

        return () => gsap.killTweensOf(type);
    }, []);

    return (
        <span
            ref={textRef}
            className="
        relative z-10
        bg-gradient-to-r
        from-emerald-300
        via-blue-300
        to-purple-300
        bg-clip-text
        text-transparent
        whitespace-nowrap
      "
        />
    );
}
