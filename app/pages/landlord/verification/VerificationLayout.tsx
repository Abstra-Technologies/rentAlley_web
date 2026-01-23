"use client";

interface Props {
    children: React.ReactNode;
}

export default function VerificationLayout({ children }: Props) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-xl text-center font-bold">Landlord Verification</h2>
                    {children}
                </div>
            </div>
        </div>
    );
}