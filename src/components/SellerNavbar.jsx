import { useNavigate } from "react-router-dom";
import logo from "../assets/ws-logo.png";
import { FaHome, FaPlus, FaMapMarkerAlt, FaUser } from "react-icons/fa";

export default function SellerNavbar() {
  const navigate = useNavigate();

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-20 bg-black/40 backdrop-blur-md items-center py-6 gap-8 border-r border-white/10">
        
        <button onClick={() => navigate("/workstation")}>
          <FaHome />
        </button>

        <button onClick={() => navigate("/upload")}>
          <FaPlus />
        </button>

        <button onClick={() => navigate("/map")}>
          <FaMapMarkerAlt />
        </button>

        <button onClick={() => navigate("/profile")}>
          <FaUser />
        </button>

      </div>

      {/* MOBILE NAVBAR */}
      <div className="md:hidden fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none z-50">

        <div className="bg-white/10 backdrop-blur-md px-6 py-3 flex gap-8 rounded-full items-center pointer-events-auto">

          <button onClick={() => navigate("/workstation")}>
            <FaHome />
          </button>

          <button onClick={() => navigate("/upload")}>
            <FaPlus />
          </button>

          <div className="bg-[#007AFF] w-14 h-14 rounded-full flex items-center justify-center -mt-8 shadow-lg">
            <img src={logo} className="w-7" alt="logo" />
          </div>

          <button onClick={() => navigate("/map")}>
            <FaMapMarkerAlt />
          </button>

          <button onClick={() => navigate("/profile")}>
            <FaUser />
          </button>

        </div>
      </div>
    </>
  );
}