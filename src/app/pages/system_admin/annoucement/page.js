'use client'

import CreateAnnouncement from "../../../../components/systemAdmin/CreateAnnouncement";
import {useRouter} from "next/navigation";

const AnnoucementPage = () => {
    const router = useRouter();

    const handleViewAnnouncements = () => {
        router.push("/pages/system_admin/annoucement/view");
    };


    return (
        <div>
            <h1>Announcements</h1>
            <CreateAnnouncement/>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={handleViewAnnouncements}
                    className="bg-green-600 text-white font-bold px-5 py-2 rounded hover:bg-green-700"
                >
                    View Announcements
                </button>
            </div>
        </div>
    );
};

export default AnnoucementPage;
