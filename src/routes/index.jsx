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
import Inbox from "../pages/InboxPage";
import CreateReel from "../pages/reels/CreateReel";
import Activity from "../pages/workspace/Activity";
import Bookings from "../pages/workstation/Bookings";
import LiveService from "../pages/workstation/LiveService";
import BookingDashboard from "../pages/workspace/bookingdashborad";
import HireWorker from "../pages/workspace/Hireworker";
import Orders from "../pages/workspace/Orderdashboard";
import LiveServices from "../pages/workspace/LiveService";
import Tracking from "../pages/workspace/Tracking";
import TrackingDashboard from "../pages/workspace/trackingdashboard";
import Sellersetting from "../pages/settings/sellersSetting";


export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/workstation"
          element={
            <MainLayout role="seller">
              <Workstation />
            </MainLayout>
          }
        />
        <Route
          path="/workspace"
          element={
            <MainLayout role="buyer">
              <Workspace />
            </MainLayout>
          }
        />
        <Route
          path="/reels"
          element={
            <MainLayout>
              <ReelsPage />
            </MainLayout>
          }
        />
        <Route
          path="/inbox"
          element={
            <MainLayout>
              <Inbox />
            </MainLayout>
          }
        />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/buyer-profile"
          element={
            <MainLayout role="buyer">
              <BuyerProfile />
            </MainLayout>
          }
        />
        <Route
          path="/seller-profile"
          element={
            <MainLayout role="seller">
              <SellerProfile />
            </MainLayout>
          }
        />
            <Route
          path="/create-reel"
          element={
            <MainLayout role="seller">
              <CreateReel />
            </MainLayout>
          }
        />
         <Route
          path="/activity"
          element={
            <MainLayout role="seller">
              <Activity />
            </MainLayout>
          }
        />
         <Route
          path="/Bookings"
          element={
            <MainLayout>
              <Bookings />
            </MainLayout>
          }
        />
         <Route
          path="/live-service"
          element={
            <MainLayout role="seller">
              <LiveService />
            </MainLayout>
          }
        />
          <Route
          path="/booking-dashboard"
          element={
            <MainLayout>
              <BookingDashboard />
            </MainLayout>
          }
        />
         <Route
          path="/hire-worker"
          element={
            <MainLayout role="seller">
              <HireWorker />
            </MainLayout>
          }
        />
         <Route
          path="/order-dashboard"
          element={
            <MainLayout role="seller">
              <Orders />
            </MainLayout>
          }
        />
         <Route
          path="/live-services"
          element={
            <MainLayout role="seller">
              <LiveServices />
            </MainLayout>
          }
        />
        <Route
          path="/tracking"
          element={
            <MainLayout role="seller">
              <Tracking />
            </MainLayout>
          }
        />
        <Route
          path="/tracking-dashboard"
          element={
            <MainLayout role="seller">
              <TrackingDashboard />
            </MainLayout>
          }
        />
        <Route
          path="/seller-settings"
          element={
            <MainLayout role="seller">
              <Sellersetting />
            </MainLayout>
          }
        />
      </Routes>
   
    </BrowserRouter>
  );
}
