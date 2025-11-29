"use client";

import { useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import "pdfjs-dist/legacy/web/pdf_viewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PDFViewer({ fileUrl }: { fileUrl: string }) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!fileUrl || !containerRef.current) return;

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        loadingTask.promise.then(async (pdf) => {
            containerRef.current!.innerHTML = ""; // Clear old pages

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const viewport = page.getViewport({ scale: 1.3 });

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d")!;
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                containerRef.current!.appendChild(canvas);

                await page.render({
                    canvasContext: ctx,
                    viewport,
                }).promise;
            }
        });
    }, [fileUrl]);

    return (
        <div
            ref={containerRef}
            className="w-full max-h-[70vh] overflow-auto border rounded-xl bg-gray-50 p-2"
        ></div>
    );
}
