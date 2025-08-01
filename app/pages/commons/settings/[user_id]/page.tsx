import React from "react";
import { notFound } from "next/navigation";
import { getUserSettings } from "@/lib/api"; // You should create this API or use your own
import SettingsForm from "@/components/forms/SettingsForm"; // Reusable form component (optional)
import SideNavProfile from "@/components/navigation/sidebar-profile";

// @ts-ignore
export const metadata = {
    title: "User Other Settings",
};

type Props = {
    params: {
        user_id: string;
    };
};

const UserSettingsPage = async ({ params }: Props) => {
    const { user_id } = params;

    // // Fetch user settings (you need to implement this)
    // const userSettings = await getUserSettings(user_id);
    //
    // if (!userSettings) {
    //     notFound(); // Show 404 if user not found
    // }

    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            <SideNavProfile />

        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Other Settings</h1>
            {/*<SettingsForm userId={user_id} initialData={userSettings} />*/}
        </div>
        </div>
    );
};

export default UserSettingsPage;
