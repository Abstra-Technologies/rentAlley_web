export default function ProrateNotice({ proratedAmount }) {
    if (!proratedAmount) return null;

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-green-500">
            <h3 className="text-lg font-medium">Prorated Billing</h3>
            <p className="text-gray-600 mt-1">
                Your adjusted total:{" "}
                <span className="font-semibold text-green-600">
          ₱{proratedAmount.toFixed(2)}
        </span>
            </p>
        </div>
    );
}
