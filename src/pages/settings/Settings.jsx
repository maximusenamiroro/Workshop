import React, { useState } from "react";
import {
  FaUser,
  FaBell,
  FaDatabase,
  FaQuestionCircle,
  FaGlobe,
  FaUserPlus,
  FaPlusCircle,
  FaSignOutAlt,
} from "react-icons/fa";
import { Home, MessageCircle, User } from "lucide-react";
import { TbPlanet } from "react-icons/tb";

const settingsMenu = [
  { name: "Account", icon: <FaUser /> },
  { name: "Notifications", icon: <FaBell /> },
  { name: "Storage and Data", icon: <FaDatabase /> },
  { name: "Help and Feedback", icon: <FaQuestionCircle /> },
  { name: "Language", icon: <FaGlobe /> },
  { name: "Invite a Friend", icon: <FaUserPlus /> },
  { name: "Add Account", icon: <FaPlusCircle /> },
  { name: "Log Out", icon: <FaSignOutAlt />, danger: true },
];

// ---------------- NAV ITEM (same as ReelsPage) ----------------
function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center transition-all
        ${
          active
            ? "bg-white text-black px-5 py-2 rounded-2xl scale-105 shadow-md"
            : "text-gray-400 px-3 py-2"
        }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

export default function SettingsMenu() {
  const [activePage, setActivePage] = useState("profile");

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white">

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-24 bg-gray-900 items-center py-4 space-y-6">
        <NavItem
          icon={<Home size={28} />}
          label="Home"
          active={activePage === "reels"}
          onClick={() => setActivePage("reels")}
        />
        <NavItem
          icon={<MessageCircle size={28} />}
          label="Inbox"
          active={activePage === "Inbox"}
          onClick={() => setActivePage("Inbox")}
        />
        <NavItem
          icon={<TbPlanet size={28} />}
          label="Workspace"
          active={activePage === "Workspace"}
          onClick={() => setActivePage("Workspace")}
        />
        <NavItem
          icon={<User size={28} />}
          label="Profile"
          active={activePage === "profile"}
          onClick={() => setActivePage("profile")}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col w-full">

        {/* SETTINGS BODY (85% on mobile) */}
        <div className="flex-1 h-[85vh] md:h-full overflow-y-auto px-4 py-6">
          <div className="max-w-md mx-auto bg-zinc-900 shadow-lg rounded-2xl p-4">
            <h2 className="text-xl font-semibold mb-4 text-white">Settings</h2>
            <ul className="space-y-2">
              {settingsMenu.map((item, index) => (
                <li
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition
                    ${
                      item.danger
                        ? "text-red-400 hover:bg-red-500/10"
                        : "text-gray-200 hover:bg-zinc-800"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-zinc-600">{">"}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* MOBILE NAVBAR (15%) */}
        <div className="h-[15vh] md:hidden bg-black/90 backdrop-blur-md flex justify-around items-center">
          <NavItem
            icon={<Home size={28} />}
            label="Home"
            active={activePage === "reels"}
            onClick={() => setActivePage("reels")}
          />
          <NavItem
            icon={<MessageCircle size={28} />}
            label="Inbox"
            active={activePage === "Inbox"}
            onClick={() => setActivePage("Inbox")}
          />
          <NavItem
            icon={<TbPlanet size={28} />}
            label="Workspace"
            active={activePage === "Workspace"}
            onClick={() => setActivePage("Workspace")}
          />
          <NavItem
            icon={<User size={28} />}
            label="Profile"
            active={activePage === "profile"}
            onClick={() => setActivePage("profile")}
          />
        </div>

      </div>
    </div>
  );
}