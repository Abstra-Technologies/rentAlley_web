"use client";
import { useEffect, useState } from "react";

export default function Clock() {
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setDateTime(
        now.toLocaleString("en-US", {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-xs sm:text-sm text-gray-200 font-medium drop-shadow-md">
      {dateTime}
    </span>
  );
}
