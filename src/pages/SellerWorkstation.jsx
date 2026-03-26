import { FaBell, FaUpload, FaEye } from "react-icons/fa";

export default function Workstation() {
  return (
    <div className="h-full bg-black text-white flex flex-col">

      {/* HEADER */}
      <div className="flex justify-between items-center px-4 py-5 border-b border-white/10">
        <h1 className="text-xl font-semibold">Workstation</h1>
        <FaBell />
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-24 px-4">

        {/* LIVE */}
        <div className="bg-white/5 p-5 rounded-2xl mb-4">
          <h2 className="mb-3">Live Service Mode</h2>

          <div className="flex justify-between items-center">
            <span>Cleaning</span>

            <div className="w-12 h-6 bg-blue-500 rounded-full flex items-center px-1">
              <div className="w-5 h-5 bg-white rounded-full ml-auto"></div>
            </div>
          </div>

          <p className="text-sm text-blue-400 mt-2">Status: Online</p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 gap-4">

          <div className="bg-white/5 p-4 rounded-2xl">
            <FaUpload className="text-blue-500 mb-2" />
            <p>Upload Work</p>

            <button className="mt-3 w-full bg-blue-600 py-2 rounded-xl">
              Upload
            </button>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl">
            <FaEye className="text-blue-500 mb-2" />
            <p>Post Views</p>

            <h2 className="text-xl mt-2">248</h2>
          </div>

        </div>

      </div>

    </div>
  );
}