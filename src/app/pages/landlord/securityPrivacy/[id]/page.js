"use client";

import { useParams } from "next/navigation";
import ProfilePage from "../../../../../components/profilePage"; 
import { useState, useEffect } from "react";
import axios from "axios";
import SecurityPage from "../../../../../components/securityPrivacy";

export default function LandlordSecurityPrivacy() {
  return ( <SecurityPage/>

  );
}
