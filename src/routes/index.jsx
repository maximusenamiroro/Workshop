import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Layout
import MainLayout from "../layouts/MainLayout";

// Pages
import Landing from "../pages/Landing";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Register";        // You named it Register
import ResetPassword from "../pages/auth/resetpassword";
import ReelsPage from "../pages/reels/ReelsPage";
import Workspace from "../pages/Buyerworkspace";
import Workstation from "../pages/SellerWorkstation";
import Inbox from "../pages/InboxPage";

// Other pages
import CreateReel from "../pages/reels/CreateReel";
import Activity from "../pages/workspace/Activity";
import Bookings from "../pages/workstation/Bookings";
import LiveService from "../pages/workstation/LiveService";
import BookingDashboard from "../pages/workspace/bookingdashborad";
import HireWorker from "../pages/workspace/Hireworker";
import ProductOrders from "../pages/workspace/Productorder";
import LiveServices from "../pages/workspace/LiveService";
import Tracking from "../pages/workspace/Tracking";
import TrackingDashboard from "../pages/workspace/trackingdashboard";
import Sellersetting from "../pages/settings/sellersSetting";
import Settings from "../pages/settings/Settings";
import SellerProfile from "../pages/profile/SellerProfile";
import BuyerProfile from "../pages/profile/BuyerProfile";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/reels" replace />;
  }

  return children;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Reels - Main landing page after login (as you requested) */}
        <Route
          path="/reels"
          element={
            <MainLayout>
              <ReelsPage />
            </MainLayout>
          }
        />

        {/* Client Routes */}
        <Route
          path="/workspace"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MainLayout>
                <Workspace />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Worker Routes */}
        <Route
          path="/workstation"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <MainLayout>
                <Workstation />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Common Routes */}
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Inbox />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Client Specific */}
        <Route
          path="/buyer-profile"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MainLayout>
                <BuyerProfile />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/productorder"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MainLayout>
                <ProductOrders />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Worker Specific */}
        <Route
          path="/seller-profile"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <MainLayout>
                <SellerProfile />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-reel"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <MainLayout>
                <CreateReel />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <MainLayout>
                <Activity />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/Bookings"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <MainLayout>
                <Bookings />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/live-service"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <MainLayout>
                <LiveService />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking-dashboard"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <MainLayout>
                <BookingDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hire-worker"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <MainLayout>
                <HireWorker />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/live-services"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <MainLayout>
                <LiveServices />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tracking"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <MainLayout>
                <Tracking />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tracking-dashboard"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <MainLayout>
                <TrackingDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller-settings"
          element={
            <ProtectedRoute allowedRoles={["worker"]}>
              <MainLayout>
                <Sellersetting />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/reels" replace />} />
      </Routes>
    </BrowserRouter>
  );
}