import React from "react";
import { Home, User, MessageCircle, Briefcase } from "lucide-react";
import { TbPlanet } from "react-icons/tb";
import { useNavigate, useLocation } from "react-router-dom";

// ---------------- NAV ITEM ----------------
function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center transition-all
        ${
          active
            ? "bg-white text-black px-4 py-2 rounded-2xl scale-105 shadow-md"
            : "text-gray-400 px-3 py-2 hover:text-white"
        }`}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}

// ---------------- MAIN LAYOUT ----------------
export default function MainLayout({ children, role = "buyer" }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ detect active route automatically
  const isActive = (path) => location.pathname === path;

  // ✅ DIFFERENT ICON FOR SELLER
  const workspaceIcon =
    role === "seller" ? <Briefcase size={28} /> : <TbPlanet size={28} />;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-black text-white">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden md:flex flex-col w-24 bg-gray-900 items-center py-4 space-y-6">
        <NavItem
          icon={<Home size={28} />}
          label="Home"
          active={isActive("/")}
          onClick={() => navigate("/")}
        />

        <NavItem
          icon={<MessageCircle size={28} />}
          label="Inbox"
          active={isActive("/inbox")}
          onClick={() => navigate("/inbox")}
        />

        <NavItem
          icon={workspaceIcon}
          label={role === "seller" ? "Workstation" : "Workspace"}
          active={isActive(role === "seller" ? "/workstation" : "/workspace")}
          onClick={() =>
            navigate(role === "seller" ? "/workstation" : "/workspace")
          }
        />

        <NavItem
          icon={<User size={28} />}
          label={role === "seller-profile" ? " Profile" : " Profile"}
          active={isActive(
            role === "seller" ? "/seller-profile" : "/buyer-profile",
          )}
          onClick={() =>
            navigate(role === "seller" ? "/seller-profile" : "/buyer-profile")
          }
        />
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col w-full">
        {/* 🔥 FIXED SCROLL ISSUE HERE */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* ================= MOBILE NAV ================= */}
        <div className="md:hidden bg-black/90 backdrop-blur-md flex justify-around items-center py-3 border-t border-white/10">
          <NavItem
            icon={<Home size={24} />}
            label="Home"
            active={isActive("/")}
            onClick={() => navigate("/")}
          />

          <NavItem
            icon={<MessageCircle size={24} />}
            label="Inbox"
            active={isActive("/inbox")}
            onClick={() => navigate("/inbox")}
          />

          <NavItem
            icon={workspaceIcon}
            label={role === "seller" ? "Work" : "Workspace"}
            active={isActive(role === "seller" ? "/workstation" : "/workspace")}
            onClick={() =>
              navigate(role === "seller" ? "/workstation" : "/workspace")
            }
          />

          <NavItem
            icon={<User size={24} />}
            label={role === "seller-profile" ? " Profile" : " Profile"}
            active={isActive(
              role === "seller" ? "/seller-profile" : "/buyer-profile",
            )}
            onClick={() =>
              navigate(role === "seller" ? "/seller-profile" : "/buyer-profile")
            }
          />
        </div>
      </div>
    </div>
  );
}
