import React from "react";
import { FaArrowLeft } from "react-icons/fa";

const helpOptions = [
  {
    name: "FAQ / Help Center",
    description: "Browse common questions and guides to solve issues.",
  },
  {
    name: "Report a Problem",
    description: "Report bugs, glitches, or inappropriate content.",
  },
  {
    name: "Send Feedback",
    description: "Share suggestions to improve the app.",
  },
  {
    name: "Community Guidelines",
    description: "Read the rules and policies of the platform.",
  },
  {
    name: "Contact Support",
    description: "Contact support directly if you need help.",
  },
];

export default function HelpAndFeedback({ onBack }) {
  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-2xl p-4">
      {/* Back button */}
      <div className="flex items-center mb-4 cursor-pointer" onClick={onBack}>
        <FaArrowLeft className="mr-2" />
        <span className="font-medium">Help & Feedback</span>
      </div>

      <ul className="space-y-4">
        {helpOptions.map((option, index) => (
          <li
            key={index}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 transition cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{option.name}</span>
              <span className="text-xs text-gray-500">{option.description}</span>
            </div>
            <span className="text-gray-400">{">"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}