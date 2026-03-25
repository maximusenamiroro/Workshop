import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">

      {/* Logo / Title */}
      <h1 className="text-4xl font-bold mb-10">Your App</h1>

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-[80%] max-w-sm">

        <button
          onClick={() => navigate("/workspace")}
          className="bg-white text-black py-3 rounded-xl font-semibold"
        >
          Enter as Buyer
        </button>

        <button
          onClick={() => navigate("/workstation")}
          className="bg-gray-900 border border-gray-700 py-3 rounded-xl font-semibold"
        >
          Enter as Seller
        </button>

      </div>

    </div>
  );
}