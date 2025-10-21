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
            // Split heading & subtitle into animation targets
            const splitTitle = new SplitText(titleRef.current, { type: "chars" });
            const splitSubtitle = new SplitText(subtitleRef.current, { type: "words" });

            const tl = gsap.timeline({ delay: 0.3 });

            // Animate main tagline
            tl.from(splitTitle.chars, {
                opacity: 0,
                y: 60,
                stagger: 0.05,
                ease: "back.out(1.7)",
                duration: 1,
            });

            // Animate initial benefit words
            tl.from(
                splitSubtitle.words,
                {
                    opacity: 0,
                    y: 20,
                    stagger: 0.08,
                    duration: 0.8,
                    ease: "power3.out",
                },
                "-=0.4"
            );

            // Cycle through benefits (fade text transitions)
            const benefits = [
                "Simplify property management.",
                "Empower tenants with transparency.",
                "Automate billing and payments.",
                "Track maintenance effortlessly.",
                "Grow your rental business with confidence.",
            ];

            const textTimeline = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
            benefits.forEach((text) => {
                textTimeline.to(subtitleRef.current, {
                    duration: 1,
                    opacity: 1,
                    onComplete: () => {
                        subtitleRef.current!.textContent = text;
                    },
                });
                textTimeline.to(subtitleRef.current, {
                    duration: 1,
                    opacity: 1,
                });
            });
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center px-6 overflow-hidden text-center">
            <h1
                ref={titleRef}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-white "
            >
                Connect More. Manage Less.
            </h1>

            <p
                ref={subtitleRef}
                className="text-blue-50 text-lg sm:text-xl lg:text-2xl font-medium max-w-2xl"
            >
                Built for landlords and tenants who value simplicity.
            </p>
        </div>
    );
}
