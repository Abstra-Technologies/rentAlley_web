"use client";

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-100 z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        </div>
    );
}
