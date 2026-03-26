import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReelsPage from "../pages/reels/ReelsPage";
import Settings from "../pages/settings/Settings";
import Login from "../pages/auth/Login";
import Landing from "../pages/Landing";
import SellerProfile from "../pages/profile/SellerProfile";
import BuyerProfile from "../pages/profile/BuyerProfile";
import Workspace from "../pages/Buyerworkspace";
import Workstation from "../pages/SellerWorkstation";
import MainLayout from "../layouts/MainLayout";
import InboxList from "../components/inbox/InboxList";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/workstation" element={<MainLayout><Workstation /></MainLayout>} />
        <Route path="/workspace" element={<MainLayout><Workspace /></MainLayout>} />
        <Route path="/reels" element={<MainLayout><ReelsPage /></MainLayout>} />
        <Route path="/chat" element={<MainLayout><InboxList/></MainLayout>} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/buyer-profile" element={<BuyerProfile />} />
        <Route path="/seller-profile" element={<SellerProfile />} />
        
      </Routes>
    </BrowserRouter>
  );
}