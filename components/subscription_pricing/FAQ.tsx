export default function FAQ() {
    return (
        <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>

            <div className="bg-white rounded-lg shadow-md overflow-hidden divide-y">
                <div className="p-6">
                    <h3 className="font-medium">Can I change my plan later?</h3>
                    <p className="text-gray-600 mt-2">
                        Yes. Upgrading is prorated automatically.
                    </p>
                </div>

                <div className="p-6">
                    <h3 className="font-medium">Is there a long-term contract?</h3>
                    <p className="text-gray-600 mt-2">No. You can cancel anytime.</p>
                </div>

                <div className="p-6">
                    <h3 className="font-medium">What payment methods do you accept?</h3>
                    <p className="text-gray-600 mt-2">We accept payments through Maya.</p>
                </div>
            </div>
        </div>
    );
}
