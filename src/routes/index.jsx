import { BrowserRouter, Routes, Route, Navigate, lazy, Suspense } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../layouts/MainLayout";

// Eagerly load auth pages only
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Register";
import ResetPassword from "../pages/auth/resetpassword";
import Landing from "../pages/Landing";

// Lazy load everything else
const ReelsPage = lazy(() => import("../pages/reels/ReelsPage"));
const Workspace = lazy(() => import("../pages/Buyerworkspace"));
const Workstation = lazy(() => import("../pages/SellerWorkstation"));
const Inbox = lazy(() => import("../pages/InboxPage"));
const CreateReel = lazy(() => import("../pages/reels/CreateReel"));
const SavedReels = lazy(() => import("../pages/reels/SavedReels"));
const Bookings = lazy(() => import("../pages/workstation/Bookings"));
const HireWorker = lazy(() => import("../pages/workspace/Hireworker"));
const Tracking = lazy(() => import("../pages/workspace/Tracking"));
const SellerProfile = lazy(() => import("../pages/profile/SellerProfile"));
const BuyerProfile = lazy(() => import("../pages/profile/BuyerProfile"));
const ProductCatalogue = lazy(() => import("../pages/workspace/ProductCatalouge"));
const SubCategoriesPage = lazy(() => import("../pages/workspace/SubCategoriesPage"));
const ProductDetail = lazy(() => import("../pages/workspace/ProductDetails"));
const MyOrders = lazy(() => import("../pages/workspace/Productorder"));
const NewArrivalsPage = lazy(() => import("../pages/workspace/NewArrivalsPage"));
const BookingDashboard = lazy(() => import("../pages/workspace/bookingdashborad"));
const BrowseCategories = lazy(() => import("../pages/workspace/BrowseCategories"));
const Activity = lazy(() => import("../pages/workspace/Activity"));
const LiveService = lazy(() => import("../pages/workstation/LiveService"));
const LiveServices = lazy(() => import("../pages/workspace/LiveService"));
const Sellersetting = lazy(() => import("../pages/settings/sellersSetting"));
const Settings = lazy(() => import("../pages/settings/Settings"));

const PageLoader = () => (
  <div className="h-screen bg-black flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading || (user && allowedRoles && !role)) {
    return <PageLoader />;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/reels" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/reels" replace />;
  return children;
};

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Reels */}
          <Route path="/reels" element={<ProtectedRoute><MainLayout><ReelsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/saved-reels" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><SavedReels /></MainLayout></ProtectedRoute>} />
          <Route path="/create-reel" element={<ProtectedRoute allowedRoles={["worker"]}><MainLayout><CreateReel /></MainLayout></ProtectedRoute>} />

          {/* Client */}
          <Route path="/workspace" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><Workspace /></MainLayout></ProtectedRoute>} />
          <Route path="/buyer-profile" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><BuyerProfile /></MainLayout></ProtectedRoute>} />
          <Route path="/subcategories" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><SubCategoriesPage /></MainLayout></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><MyOrders /></MainLayout></ProtectedRoute>} />
          <Route path="/new-arrivals" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><NewArrivalsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/hire-worker" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><HireWorker /></MainLayout></ProtectedRoute>} />
          <Route path="/hire-worker/:id" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><HireWorker /></MainLayout></ProtectedRoute>} />
          <Route path="/booking-dashboard" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><BookingDashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/browse-categories" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><BrowseCategories /></MainLayout></ProtectedRoute>} />
          <Route path="/shop" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><ProductCatalogue /></MainLayout></ProtectedRoute>} />
          <Route path="/product/:id" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><ProductDetail /></MainLayout></ProtectedRoute>} />
          <Route path="/live-services" element={<ProtectedRoute allowedRoles={["client"]}><MainLayout><LiveServices /></MainLayout></ProtectedRoute>} />
          <Route path="/tracking/:bookingId" element={<ProtectedRoute allowedRoles={["client"]}><Tracking /></ProtectedRoute>} />

          {/* Worker */}
          <Route path="/workstation" element={<ProtectedRoute allowedRoles={["worker"]}><MainLayout><Workstation /></MainLayout></ProtectedRoute>} />
          <Route path="/seller-profile" element={<ProtectedRoute allowedRoles={["worker"]}><MainLayout><SellerProfile /></MainLayout></ProtectedRoute>} />
          <Route path="/Bookings" element={<ProtectedRoute allowedRoles={["worker"]}><MainLayout><Bookings /></MainLayout></ProtectedRoute>} />
          <Route path="/live-service" element={<ProtectedRoute allowedRoles={["worker"]}><MainLayout><LiveService /></MainLayout></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute allowedRoles={["worker"]}><MainLayout><Activity /></MainLayout></ProtectedRoute>} />
          <Route path="/seller-settings" element={<ProtectedRoute allowedRoles={["worker"]}><MainLayout><Sellersetting /></MainLayout></ProtectedRoute>} />

          {/* Shared */}
          <Route path="/seller-profile/:id" element={<ProtectedRoute allowedRoles={["client", "worker"]}><MainLayout><SellerProfile /></MainLayout></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><MainLayout><Inbox /></MainLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/reels" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}