import { FaBell, FaUpload, FaEye, FaHome, FaUser, FaMapMarkerAlt } from "react-icons/fa";
import logo from "../assets/ws-logo.png";

export default function Workstation() {
  return (
    <div className="min-h-screen bg-black text-white pb-32 px-4">

      {/* HEADER */}
      <div className="flex justify-between items-center py-5">
        <h1 className="text-2xl font-semibold">Workstation</h1>
        <FaBell />
      </div>

      {/* LIVE CARD */}
      <div className="glass p-5 mb-4 shadow-soft">
        <h2 className="mb-3">Live Service Mode</h2>

        <div className="flex justify-between items-center">
          <span>Cleaning</span>

          <div className="w-12 h-6 bg-blue-500 rounded-full flex items-center px-1">
            <div className="w-5 h-5 bg-white rounded-full ml-auto"></div>
          </div>
        </div>

        <p className="text-sm text-blue-400 mt-2">Status: Online</p>
        <p className="text-xs text-white/50">4.8157, 7.0498</p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-4">

        {/* UPLOAD */}
        <div className="glass p-4 shadow-soft">
          <FaUpload className="text-blue-500 mb-2" />
          <p>Upload Work</p>

          <button className="mt-3 w-full bg-blue-600 py-2 rounded-xl">
            Upload
          </button>
        </div>

        {/* VIEWS */}
        <div className="glass p-4 shadow-soft">
          <FaEye className="text-blue-500 mb-2" />
          <p>Post Views</p>

          <h2 className="text-xl mt-2">248</h2>
          <p className="text-xs text-white/50">Total Views</p>
        </div>

      </div>

      {/* POSTS */}
      <div className="mt-5">
        <h3 className="mb-3">Your Work Posts</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass p-2">
            <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952"
              className="rounded-lg h-28 w-full object-cover" />
            <p className="text-sm mt-2">Deep Cleaning</p>
            <p className="text-xs text-blue-400">$80</p>
          </div>

          <div className="glass p-2">
            <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836"
              className="rounded-lg h-28 w-full object-cover" />
            <p className="text-sm mt-2">Cooking</p>
            <p className="text-xs text-blue-400">$60</p>
          </div>
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