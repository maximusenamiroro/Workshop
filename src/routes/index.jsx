import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReelsPage from "../pages/reels/ReelsPage";
import Settings from "../pages/settings/Settings";
import Login from "../pages/auth/Login";
import SellerProfile from "../pages/profile/SellerProfile";
import BuyerProfile from "../pages/profile/BuyerProfile";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReelsPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/buyer-profile" element={<BuyerProfile />} />
        <Route path="/seller-profile" element={<SellerProfile />} />
      </Routes>
    </BrowserRouter>
  );
}