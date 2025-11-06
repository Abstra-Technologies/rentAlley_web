"use client";
import React from "react";
import {
  Users,
  Wrench,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface ScoreCardProps {
  title: string;
  value: number | string;
  borderColor?: "green" | "blue" | "red" | "yellow" | "purple" | "gray";
}

const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  value,
  borderColor = "green",
}) => {
  // Icon mapping based on title keywords
  const getIcon = () => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("tenant")) return Users;
    if (titleLower.includes("maintenance") || titleLower.includes("request"))
      return Wrench;
    if (titleLower.includes("revenue") || titleLower.includes("payment"))
      return DollarSign;
    if (titleLower.includes("growth") || titleLower.includes("trend"))
      return TrendingUp;
    return AlertCircle;
  };

  // Color configurations
  const colorConfig = {
    green: {
      gradient: "from-emerald-100 to-green-100",
      icon: "text-emerald-600",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    blue: {
      gradient: "from-blue-100 to-cyan-100",
      icon: "text-blue-600",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    red: {
      gradient: "from-red-100 to-rose-100",
      icon: "text-red-600",
      text: "text-red-700",
      border: "border-red-200",
    },
    yellow: {
      gradient: "from-amber-100 to-yellow-100",
      icon: "text-amber-600",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    purple: {
      gradient: "from-purple-100 to-pink-100",
      icon: "text-purple-600",
      text: "text-purple-700",
      border: "border-purple-200",
    },
    gray: {
      gradient: "from-gray-100 to-slate-100",
      icon: "text-gray-600",
      text: "text-gray-700",
      border: "border-gray-200",
    },
  };

  const config = colorConfig[borderColor];
  const IconComponent = getIcon();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
            {value ?? 0}
          </p>
        </div>
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${config.icon}`} />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${
              borderColor === "green"
                ? "from-emerald-600 to-green-600"
                : borderColor === "blue"
                ? "from-blue-600 to-cyan-600"
                : borderColor === "red"
                ? "from-red-600 to-rose-600"
                : borderColor === "yellow"
                ? "from-amber-600 to-yellow-600"
                : borderColor === "purple"
                ? "from-purple-600 to-pink-600"
                : "from-gray-600 to-slate-600"
            } rounded-full transition-all duration-500`}
            style={{
              width: typeof value === "number" && value > 0 ? "100%" : "0%",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
