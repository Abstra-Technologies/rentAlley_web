import { AlertTriangle } from "lucide-react";

const CardWarning = () => {
    return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-lg shadow-md flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
                <h4 className="font-semibold text-red-700">REMINDER!</h4>
                <h2 className="text-2xl font-medium">Front-end Developer. Modify this page UI</h2>
                <p>Please view the front-end page code for further details.</p>
            </div>
        </div>
    );
};

export default CardWarning;
