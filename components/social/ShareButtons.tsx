"use client";
import { FaFacebook, FaTwitter, FaLink } from "react-icons/fa";

interface ShareButtonsProps {
    unitName: string;
    propertyName: string;
    rentAmount: number;
    city: string;
    province: string;
    rentId: string | number;
}

export default function ShareButtons({
                                         unitName,
                                         propertyName,
                                         rentAmount,
                                         city,
                                         province,
                                         rentId,
                                     }: ShareButtonsProps) {
    const currentUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/pages/find-rent/${rentId}`
            : "";

    const text = `Check out Unit ${unitName} at ${propertyName} in ${city}, ${province} — ₱${rentAmount.toLocaleString()} / month!`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            alert("Link copied to clipboard!");
        } catch (error) {
            console.error("Copy failed:", error);
        }
    };

    const openShare = (url: string) => {
        const w = 600,
            h = 500;
        const left = window.innerWidth / 2 - w / 2;
        const top = window.innerHeight / 2 - h / 2;
        window.open(
            url,
            "shareWindow",
            `width=${w},height=${h},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
        );
    };

    const shareToFacebook = () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            currentUrl
        )}&quote=${encodeURIComponent(text)}`;
        openShare(url);
    };

    const shareToTwitter = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            text
        )}&url=${encodeURIComponent(currentUrl)}`;
        openShare(url);
    };

    return (
        <div className="flex items-center gap-2 sm:gap-3 mt-4">
            <button
                onClick={shareToFacebook}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-md active:scale-[0.97]"
            >
                <FaFacebook className="text-lg" />
                Share
            </button>

            <button
                onClick={shareToTwitter}
                className="flex items-center gap-2 px-3 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-all shadow-md active:scale-[0.97]"
            >
                <FaTwitter className="text-lg" />
                Tweet
            </button>

            <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300 transition-all shadow-md active:scale-[0.97]"
            >
                <FaLink className="text-lg" />
                Copy Link
            </button>
        </div>
    );
}
