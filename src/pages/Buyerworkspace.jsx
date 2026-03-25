import { FaBell, FaHome, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import logo from "../assets/ws-logo.png";

export default function Workspace() {
  return (
    <div className="min-h-screen bg-black text-white pb-32 px-4">

      {/* HEADER */}
      <div className="flex justify-between items-center py-5">
        <h1 className="text-2xl font-semibold">Workspace</h1>
        <FaBell />
      </div>

      {/* PRODUCT CARD */}
      <div className="glass p-4 mb-4 shadow-soft">

        <h2 className="mb-3">Product Orders</h2>

        <div className="flex justify-between items-center">
          <div>
            <p>Cooking Gas</p>
            <p className="text-blue-400 text-sm">Shipping</p>
          </div>

          <span className="text-xs text-white/50">2 days</span>
        </div>

      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-4">

        {/* BOOKINGS */}
        <div className="glass p-4 shadow-soft">
          <h3 className="mb-2">Bookings</h3>
          <p className="text-sm">Electrician</p>
          <p className="text-xs text-white/50">Tomorrow 10AM</p>
        </div>

        {/* LIVE */}
        <div className="glass p-4 shadow-soft">
          <h3 className="mb-2">Live Service</h3>
          <p className="text-sm">Driver on the way</p>
          <p className="text-xs text-blue-400">ETA 12 mins</p>

          <button className="mt-3 bg-blue-600 w-full py-2 rounded-xl">
            View Map
          </button>
        </div>

      </div>

      {/* ACTIVE */}
      <div className="glass p-4 mt-4 shadow-soft">
        <h3>Active Hires</h3>

        <div className="flex justify-between mt-2">
          <span>Cleaner</span>
          <span className="text-blue-400 text-sm">
            Arriving in 5 mins
          </span>
        </div>
      </div>

      {/* NAVBAR */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
        <div className="glass px-6 py-3 flex gap-8 rounded-full">

          <FaHome />
          <FaMapMarkerAlt />

          <div className="bg-blue-600 w-14 h-14 rounded-full flex items-center justify-center -mt-8">
            <img src={logo} className="w-7" />
          </div>

          <FaUser />

        </div>
      </div>

    </div>
  );
}