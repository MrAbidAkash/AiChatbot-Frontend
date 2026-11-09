// app/components/UsageLimits.tsx
"use client";

import { useState, useEffect } from "react";
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaChartLine,
  FaSync,
  FaBell,
  FaRocket,
} from "react-icons/fa";

export default function UsageLimits() {
  const [usage, setUsage] = useState({
    messages: { used: 1247, limit: 5000 },
    pages: { used: 2, limit: 5 },
    aiCalls: { used: 2450, limit: 10000 },
  });

  const getPercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getStatus = (percentage: number) => {
    if (percentage >= 90) return "critical";
    if (percentage >= 70) return "warning";
    return "good";
  };

  const plans = [
    {
      name: "Starter",
      price: "৳৫০০",
      messages: "৫০০",
      pages: "১",
      features: ["AI Auto-reply", "COD Confirmation", "No Expiry"],
    },
    {
      name: "Growth",
      price: "৳১,০০০",
      messages: "১,১০০",
      pages: "৩",
      features: [
        "10% Bonus Credit",
        "Vision AI",
        "Team Inbox",
        "No Expiry",
      ],
    },
    {
      name: "Business",
      price: "৳৫,০০০",
      messages: "৬,০০০",
      pages: "Unlimited",
      features: [
        "20% Bonus Credit",
        "Multi-page Support",
        "VIP Support",
        "No Expiry",
      ],
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Usage & Limits</h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View Detailed Report →
        </button>
      </div>

      {/* Usage Bars */}
      <div className="space-y-6 mb-8">
        {Object.entries(usage).map(([key, data]) => {
          const percentage = getPercentage(data.used, data.limit);
          const status = getStatus(percentage);

          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                  {status === "critical" && (
                    <FaExclamationTriangle className="text-red-500" />
                  )}
                </div>
                <span className="text-gray-600">
                  {data.used.toLocaleString()} /{" "}
                  {data.limit === Infinity
                    ? "Unlimited"
                    : data.limit.toLocaleString()}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    status === "critical"
                      ? "bg-red-500"
                      : status === "warning"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>
                  {status === "critical" && "⚠️ Approaching limit"}
                  {status === "warning" && "⚠️ Monitor usage"}
                  {status === "good" && "✓ Within limits"}
                </span>
                <span>{Math.round(percentage)}% used</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start space-x-3">
          <FaSync className="text-blue-600 mt-1" />
          <div>
            <div className="font-medium text-blue-900">
              Usage resets in 12 days
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Your usage limits will reset on the 1st of next month
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <FaRocket />
              <h4 className="font-bold text-lg">Ready for more?</h4>
            </div>
            <p className="text-blue-100 text-sm">
              Upgrade to unlock higher limits and premium features
            </p>
          </div>
          <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition">
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
}
