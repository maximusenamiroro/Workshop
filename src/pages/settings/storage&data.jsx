import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

const storageOptions = [
  {
    name: "Storage Usage",
    description: "View how much storage the app is using on your device.",
  },
  {
    name: "Clear Cache",
    description: "Free up space by deleting temporary files and cached data.",
  },
  {
    name: "Manage Downloads",
    description: "See downloaded files/videos and remove them if needed.",
  },
  {
    name: "Network Settings",
    description: "Control whether to use Wi-Fi only, mobile data, or both.",
  },
  {
    name: "Data Saver Mode",
    description: "Reduce data usage for slower connections or limited plans.",
  },
];

export default function StorageAndData({ onBack }) {
  const [toggles, setToggles] = useState(
    storageOptions.reduce((acc, option) => {
      // Only Data Saver Mode might need toggle
      acc[option.name] = option.name === "Data Saver Mode" ? false : null;
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
        <span className="font-medium">Storage and Data</span>
      </div>

      <ul className="space-y-4">
        {storageOptions.map((option, index) => (
          <li
            key={index}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 transition"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{option.name}</span>
              <span className="text-xs text-gray-500">{option.description}</span>
            </div>

            {/* Only toggle for Data Saver Mode */}
            {option.name === "Data Saver Mode" ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={toggles[option.name]}
                  onChange={() => handleToggle(option.name)}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 bg-gray-300 rounded-full peer ${
                    toggles[option.name] ? "bg-green-500" : ""
                  } transition-colors`}
                ></div>
                <div
                  className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    toggles[option.name] ? "translate-x-5" : ""
                  }`}
                ></div>
              </label>
            ) : (
              <span className="text-gray-400">{">"}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}