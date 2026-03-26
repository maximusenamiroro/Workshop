import React, { useState } from "react";
import { Home, User, MessageCircle } from "lucide-react";
import { TbPlanet } from "react-icons/tb";
import { useNavigate } from "react-router-dom";

// ---------------- NAV ITEM ----------------
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

// ---------------- MAIN LAYOUT ----------------
export default function MainLayout({ children }) {
  const [activePage, setActivePage] = useState("home");
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white">

      {/* ✅ DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-24 bg-gray-900 items-center py-4 space-y-6">
        
        <NavItem
          icon={<Home size={28} />}
          label="Home"
          active={activePage === "home"}
          onClick={() => {
            setActivePage("home");
            navigate("/");
          }}
        />

        <NavItem
          icon={<MessageCircle size={28} />}
          label="Inbox"
          active={activePage === "inbox"}
          onClick={() => {
            setActivePage("inbox");
            navigate("/inbox");
          }}
        />

        <NavItem
          icon={<TbPlanet size={28} />}
          label="Workspace"
          active={activePage === "workspace"}
          onClick={() => {
            setActivePage("workspace");
            navigate("/workspace");
          }}
        />

        <NavItem
          icon={<User size={28} />}
          label="Profile"
          active={activePage === "profile"}
          onClick={() => {
            setActivePage("profile");
            navigate("/buyer-profile");
          }}
        />
      </div>

      {/* ✅ PAGE CONTENT */}
      <div className="flex-1 flex flex-col w-full">
        
        {/* 🔥 MAIN CONTENT (85% on mobile) */}
        <div className="h-[85vh] md:h-full overflow-hidden">
          {children}
        </div>

        {/* ✅ MOBILE NAVBAR (15%) */}
        <div className="h-[15vh] md:hidden bg-black/90 backdrop-blur-md flex justify-around items-center">
          
          <NavItem
            icon={<Home size={28} />}
            label="Home"
            active={activePage === "home"}
            onClick={() => {
              setActivePage("home");
              navigate("/");
            }}
          />

          <NavItem
            icon={<TbPlanet size={28} />}
            label="Workspace"
            active={activePage === "workspace"}
            onClick={() => {
              setActivePage("workspace");
              navigate("/workspace");
            }}
          />

          <NavItem
            icon={<User size={28} />}
            label="Profile"
            active={activePage === "profile"}
            onClick={() => {
              setActivePage("profile");
              navigate("/buyer-profile");
            }}
          />
        </div>

      </div>
    </div>
  );
}