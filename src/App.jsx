import AppRoutes from "./routes";

export default function App() {
  return <AppRoutes />;
}

import { useState } from "react";

import SellerWorkstationBento from "./pages/SellerWorkstationBento";
import BuyerWorkspaceBento from "./pages/BuyerWorkspaceBento";

export default function App() {

  const [mode, setMode] = useState("seller");

  return (
    <div>

      {mode === "seller" ? (
        <SellerWorkstationBento />
      ) : (
        <BuyerWorkspaceBento />
      )}

      {/* SWITCH BUTTON */}
      <div className="fixed top-5 right-5">

        <button
          onClick={() =>
            setMode(mode === "seller" ? "buyer" : "seller")
          }
          className="bg-[#007AFF] px-4 py-2 rounded-lg"
        >
          Switch
        </button>

      </div>

    </div>
  );
}
