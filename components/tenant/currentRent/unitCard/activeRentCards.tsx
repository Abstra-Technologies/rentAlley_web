"use client";

import { useEffect, useState } from "react";
import UnitCardMobile from "./UnitCardMobile";
import UnitCardDesktop from "./UnitCardDesktop";

/* --------------------------------------------------
   WRAPPER — auto select mobile or desktop layout
-------------------------------------------------- */
export default function UnitCard(props: any) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile ? (
    <UnitCardMobile {...props} />
  ) : (
    <UnitCardDesktop {...props} />
  );
}
