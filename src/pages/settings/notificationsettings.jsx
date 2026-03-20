import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

const notificationOptions = [
  {
    name: "Push Notifications",
    description: "Receive alerts directly on your device for important updates.",
  },
  {
    name: "Email Notifications",
    description: "Get notifications via email about activity and updates.",
  },
  {
    name: "SMS Notifications",
    description: "Receive text messages for important alerts and reminders.",
  },
  {
    name: "Sound & Vibration",
    description: "Enable or disable sounds and vibrations for notifications.",
  },
  {
    name: "Do Not Disturb",
    description: "Schedule quiet hours when you don’t want to be disturbed.",
  },
];

export default function NotificationSettings({ onBack }) {
  const [toggles, setToggles] = useState(
    notificationOptions.reduce((acc, option) => {
      acc[option.name] = true; // default ON
      return acc;
    }, {})
  );

  const handleToggle = (name) => {
    setToggles((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-2xl p-4">
      <div className="flex items-center mb-4 cursor-pointer" onClick={onBack}>
        <FaArrowLeft className="mr-2" />
        <span className="font-medium">Notifications</span>
      </div>

      <ul className="space-y-4">
        {notificationOptions.map((option, index) => (
          <li
            key={index}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 transition"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{option.name}</span>
              <span className="text-xs text-gray-500">{option.description}</span>
            </div>

            {/* TikTok-style toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={toggles[option.name]}
                onChange={() => handleToggle(option.name)}
                className="sr-only"
              />
              <div className={`w-11 h-6 bg-gray-300 rounded-full peer 
                ${toggles[option.name] ? "bg-green-500" : ""} transition-colors`}>
              </div>
              <div
                className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform 
                  ${toggles[option.name] ? "translate-x-5" : ""}`}
              ></div>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}