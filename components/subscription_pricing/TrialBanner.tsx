export default function TrialBanner({ trialUsed }) {
    if (trialUsed) return null;

    return (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 mb-8 text-white">
            <h3 className="text-lg font-medium">Free Trial Available!</h3>
            <p>You’re eligible for a free trial. Select a plan to start.</p>
        </div>
    );
}
