"use client";

import { ReactNode } from "react";

interface AuthBackgroundProps {
  children: ReactNode;
  variant?: "light" | "dark";
}

export default function AuthBackground({
  children,
  variant = "light",
}: AuthBackgroundProps) {
  if (variant === "dark") {
    return (
      <div className="relative min-h-screen bg-slate-950">
        {/* Subtle gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.15), transparent)",
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  // Light variant (default)
  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Top gradient glow - blue to emerald */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.08), transparent)",
        }}
      />

      {/* Secondary gradient - emerald accent */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 100% 0%, rgba(16, 185, 129, 0.05), transparent)",
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
