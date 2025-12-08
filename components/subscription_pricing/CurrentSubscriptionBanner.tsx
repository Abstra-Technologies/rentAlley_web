export default function CurrentSubscriptionBanner({ currentSubscription }) {
    if (!currentSubscription) return null;

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-500">
            <h2 className="text-lg font-medium">
                Your Current Subscription
            </h2>
            <p className="text-sm text-gray-600 mt-1">
                You are currently on the{" "}
                <span className="font-semibold">{currentSubscription.plan_name}</span>
            </p>
        </div>
    );
}
