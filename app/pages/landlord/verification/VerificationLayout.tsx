import FooterActions from "@/components/landlord/verifiication/FooterActions";

interface Props {
    currentStep: number;
    setCurrentStep: (n: number) => void;
    children: React.ReactNode;
    canProceed: () => boolean;
    handleSubmit: () => void;
}

export default function VerificationLayout({
                                               currentStep,
                                               setCurrentStep,
                                               children,
                                               canProceed,
                                               handleSubmit,
                                           }: Props) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                {/* ProgressSteps */}

                <div className="bg-white rounded-2xl shadow-xl">
                    <div className="p-8">{children}</div>

                    <FooterActions
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                        canProceed={canProceed}
                        handleSubmit={handleSubmit}
                    />
                </div>

            </div>
        </div>
    );
}
