
"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(SplitText, TextPlugin);

export default function HeroText() {
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (titleRef.current && subtitleRef.current) {
            // Split heading into characters
            const split = new SplitText(titleRef.current, { type: "chars" });
            const splitSubtitle = new SplitText(subtitleRef.current, { type: "words" });

            const tl = gsap.timeline();

            // Animate heading chars
            tl.from(split.chars, {
                opacity: 0,
                y: 60,
                stagger: 0.05,
                ease: "back.out(1.7)",
                duration: 1,
            });

            // Animate subtitle with text reveal effect
            tl.from(
                splitSubtitle.words,
                {
                    opacity: 0,
                    y: 20,
                    stagger: 0.1,
                    duration: 0.8,
                    ease: "power3.out",
                },
                "-=0.5" // start slightly before title finishes
            );
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 overflow-hidden">
            <h1
                ref={titleRef}
                className="text-6xl md:text-5xl font-bold mb-4 text-center"
            >
                Rent with No Compromises
            </h1>
            <p
                ref={subtitleRef}
                className="text-white text-xl"
            >
                Enjoy a home that offers everything you've been searching for, all in
                one place.
            </p>


        </div>
    );
}
