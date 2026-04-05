import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Layout
import MainLayout from "../layouts/MainLayout";

// Pages
import Landing from "../pages/Landing";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Register";
import ResetPassword from "../pages/auth/resetpassword";
import ReelsPage from "../pages/reels/ReelsPage";
import Workspace from "../pages/Buyerworkspace";
import Workstation from "../pages/SellerWorkstation";
import Inbox from "../pages/InboxPage";
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
import ProductCatalogue from "../pages/workspace/ProductCatalouge";
import ProductDetail from "../pages/workspace/ProductDetails";

// ============ PROTECTED ROUTE ============
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading || (user && allowedRoles && !role)) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
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

// ============ PUBLIC ROUTE ============
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/reels" replace />;
  }

  return children;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Reels */}
        <Route
          path="/reels"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ReelsPage />
              </MainLayout>
            </ProtectedRoute>
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

        <Route
          path="/hire-worker"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MainLayout>
                <HireWorker />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/hire-worker/:id"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MainLayout>
                <HireWorker />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking-dashboard"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MainLayout>
                <BookingDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Shop Routes — NEW */}
        <Route
          path="/shop"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MainLayout>
                <ProductCatalogue />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/product/:id"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MainLayout>
                <ProductDetail />
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
          path="/live-services"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MainLayout>
                <LiveServices />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tracking"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MainLayout>
                <Tracking />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tracking-dashboard"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/reels" replace />} />
      </Routes>
    </BrowserRouter>
  );
}