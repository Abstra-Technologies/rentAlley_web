"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfilePage from "../../../../../components/profilePage";
import { UserIcon, ShieldCheckIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import axios from "axios";

export default function userProfile() {
    return ( <ProfilePage /> 

    );
}