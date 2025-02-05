"use client";

import { useParams } from "next/navigation";
import ProfileForm from "../../../../../components/profileForm";
import { useState, useEffect } from "react";
import axios from "axios";

const TenantProfile = () => {
  const params = useParams();
  const userId = params.id;

  const [userData, setUserData] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`/api/profile/${userId}`);
        const data = response.data;
        setUserData(data);
        console.log("User Data: ", data);
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    };
    fetchUserData();
  }, [userId]);

  return (
      <div>
        <ProfileForm userId={userId} isLandlord={false} />
      </div>
  );
};

export default TenantProfile;