'use client'
import Announcements from "../../../../components/annoucemen/announcement";
import useAuth from "../../../../../hooks/useSession";

export default function TenantAnnouncements() {
    const {user} = useAuth();

    return (
        <Announcements userType={user?.userType} />
    )
}