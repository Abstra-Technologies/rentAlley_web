"use client";

import { useEffect, useRef } from "react";
import Viewer from "@egjs/view360";

interface Unit360ViewerProps {
    imageUrl: string;
}

export default function Unit360Viewer({ imageUrl }: Unit360ViewerProps) {
    const viewerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!viewerRef.current) return;

        const viewer = new Viewer(viewerRef.current, {
            projection: "equirectangular",
            image: imageUrl,
            autoResize: true,
        });

        return () => viewer.destroy();
    }, [imageUrl]);

    return (
        <div
            ref={viewerRef}
            className="w-full h-[300px] sm:h-[400px] rounded-xl overflow-hidden border"
        />
    );
}
