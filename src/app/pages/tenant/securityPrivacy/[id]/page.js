"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserIcon, ShieldCheckIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import axios from "axios";
import SecurityPage from "../../../../../components/securityPrivacy";

export default function userSecurityPrivacy() {
    return ( <SecurityPage />

    );
}