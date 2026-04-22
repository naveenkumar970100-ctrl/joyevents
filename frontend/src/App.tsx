import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useGoogleTranslate } from "@/lib/useGoogleTranslate";
import Index from "./pages/Index";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import ServiceDetail from "./pages/ServiceDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AboutUs from "./pages/AboutUs";
import Services from "./pages/Services";
import Portfolio from "./pages/Portfolio";
import Contact from "./pages/Contact";
import UserDashboard from "./pages/UserDashboard";
import MerchantDashboard from "./pages/MerchantDashboard";
import MerchantEvents from "./pages/MerchantEvents";
import MerchantServices from "./pages/MerchantServices";
import MerchantLiveEvents from "./pages/MerchantLiveEvents";
import TicketValidation from "./pages/TicketValidation";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminMetrics from "./pages/admin/AdminMetrics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminServices from "./pages/admin/AdminServices";
import AdminReports from "./pages/admin/AdminReports";
import AdminEventMonitoring from "./pages/admin/AdminEventMonitoring";
import CreateEvent from "./pages/CreateEvent";
import AdminUtilities from "./pages/admin/AdminUtilities";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminCommissions from "./pages/admin/AdminCommissions";
import AdminRefunds from "./pages/admin/AdminRefunds";
import AdminPayouts from "./pages/admin/AdminPayouts";
import AdminBookings from "./pages/admin/AdminBookings";
import MerchantProfile from "./pages/MerchantProfile";
import CustomerProfile from "./pages/CustomerProfile";
import MerchantSettings from "./pages/MerchantSettings";
import CustomerSettings from "./pages/CustomerSettings";
import CustomerMessages from "./pages/CustomerMessages";
import CustomerBrowseEvents from "./pages/CustomerBrowseEvents";
import CustomerBrowseServices from "./pages/CustomerBrowseServices";
import CustomerEventDetail from "./pages/CustomerEventDetail";
import CustomerServiceDetail from "./pages/CustomerServiceDetail";
import AdminLanguage from "./pages/admin/AdminLanguage";
import ProtectedRoute from "@/components/ProtectedRoute";
import MyRequests from "./pages/MyRequests";
import MerchantBookings from "./pages/MerchantBookings";
import MerchantInbox from "./pages/MerchantInbox";
import EarningsDashboard from "./pages/EarningsDashboard";
import MarketingTools from "./pages/MarketingTools";
import EventAnalytics from "./pages/EventAnalytics";
import Blog from "./pages/Blog";
import Reviews from "./pages/Reviews";
import BookingHistory from "./pages/BookingHistory";
import UpcomingBookings from "./pages/UpcomingBookings";
import Favorites from "./pages/Favorites";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import QRCodeGenerator from "./pages/QRCodeGenerator";
import AIRecommendations from "./pages/AIRecommendations";
import MerchantRecommendations from "./pages/MerchantRecommendations";
import AdminRecommendations from "./pages/admin/AdminRecommendations";
import NotFound from "./pages/NotFound";
import LanguageSettings from "./pages/LanguageSettings";
import MerchantLanguage from "./pages/MerchantLanguage";

const queryClient = new QueryClient();

// Inner component so useGoogleTranslate can access i18n context
const AppRoutes = () => {
  useGoogleTranslate();
  return (
    <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/services" element={<Services />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/services/:id" element={<ServiceDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Dashboard root redirects */}
              <Route path="/customer-dashboard" element={<ProtectedRoute allowedRoles={["customer"]}><UserDashboard /></ProtectedRoute>} />
              <Route path="/merchant-dashboard" element={<ProtectedRoute allowedRoles={["merchant"]}><MerchantDashboard /></ProtectedRoute>} />
              <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminOverview /></ProtectedRoute>} />
              
              {/* Legacy redirect */}
              <Route path="/user-dashboard" element={<Navigate to="/customer-dashboard" replace />} />
              
              {/* Customer Routes */}
              <Route path="/customer-dashboard/bookings" element={<ProtectedRoute allowedRoles={["customer"]}><MyRequests /></ProtectedRoute>} />
              <Route path="/customer-dashboard/history" element={<ProtectedRoute allowedRoles={["customer"]}><BookingHistory /></ProtectedRoute>} />
              <Route path="/customer-dashboard/upcoming" element={<ProtectedRoute allowedRoles={["customer"]}><UpcomingBookings /></ProtectedRoute>} />
              <Route path="/customer-dashboard/messages" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerMessages /></ProtectedRoute>} />
              <Route path="/customer-dashboard/browse-events" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerBrowseEvents /></ProtectedRoute>} />
              <Route path="/customer-dashboard/browse-services" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerBrowseServices /></ProtectedRoute>} />
              <Route path="/customer-dashboard/events/:id" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerEventDetail /></ProtectedRoute>} />
              <Route path="/customer-dashboard/services/:id" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerServiceDetail /></ProtectedRoute>} />
              <Route path="/customer-dashboard/favorites" element={<ProtectedRoute allowedRoles={["customer"]}><Favorites /></ProtectedRoute>} />
              <Route path="/favorites" element={<ProtectedRoute allowedRoles={["customer"]}><Favorites /></ProtectedRoute>} />
              <Route path="/customer-dashboard/settings" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerSettings /></ProtectedRoute>} />
              <Route path="/customer-dashboard/profile" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerProfile /></ProtectedRoute>} />
              <Route path="/customer-dashboard/ai-recommendations" element={<ProtectedRoute allowedRoles={["customer"]}><AIRecommendations /></ProtectedRoute>} />
              <Route path="/customer-dashboard/language" element={<ProtectedRoute allowedRoles={["customer"]}><LanguageSettings /></ProtectedRoute>} />
              
              {/* Merchant Routes */}
              <Route path="/merchant-dashboard/events" element={<ProtectedRoute allowedRoles={["merchant"]}><MerchantEvents /></ProtectedRoute>} />
              <Route path="/merchant-dashboard/live-events" element={<ProtectedRoute allowedRoles={["merchant"]}><MerchantLiveEvents /></ProtectedRoute>} />
              <Route path="/merchant-dashboard/services" element={<ProtectedRoute allowedRoles={["merchant"]}><MerchantServices /></ProtectedRoute>} />
              <Route path="/merchant-dashboard/profile" element={<ProtectedRoute allowedRoles={["merchant"]}><MerchantProfile /></ProtectedRoute>} />
              <Route path="/merchant-dashboard/ticket-validation" element={<ProtectedRoute allowedRoles={["merchant"]}><TicketValidation /></ProtectedRoute>} />
              <Route path="/merchant-dashboard/analytics" element={<ProtectedRoute allowedRoles={["merchant"]}><EventAnalytics /></ProtectedRoute>} />
              <Route path="/merchant-dashboard/inbox" element={<ProtectedRoute allowedRoles={["merchant"]}><MerchantInbox /></ProtectedRoute>} />
              {/* Sidebar-aligned merchant routes */}
              <Route path="/merchant-dashboard/bookings" element={<ProtectedRoute allowedRoles={["merchant"]}><MerchantBookings /></ProtectedRoute>} />
              <Route path="/merchant-dashboard/earnings" element={<ProtectedRoute allowedRoles={["merchant"]}><EarningsDashboard /></ProtectedRoute>} />
              <Route path="/merchant-dashboard/marketing" element={<ProtectedRoute allowedRoles={["merchant"]}><MarketingTools /></ProtectedRoute>} />
              <Route path="/merchant-dashboard/qr-codes" element={<ProtectedRoute allowedRoles={["merchant"]}><QRCodeGenerator /></ProtectedRoute>} />
              <Route path="/merchant-dashboard/settings" element={<ProtectedRoute allowedRoles={["merchant"]}><MerchantSettings /></ProtectedRoute>} />
              <Route path="/merchant-dashboard/ai-recommendations" element={<ProtectedRoute allowedRoles={["merchant"]}><MerchantRecommendations /></ProtectedRoute>} />
              <Route path="/merchant-dashboard/language" element={<ProtectedRoute allowedRoles={["merchant"]}><MerchantLanguage /></ProtectedRoute>} />
              {/* Legacy merchant routes (kept for backwards compat) */}
              <Route path="/merchant-settings" element={<ProtectedRoute allowedRoles={["merchant", "admin"]}><MerchantSettings /></ProtectedRoute>} />
              <Route path="/customer-settings" element={<ProtectedRoute allowedRoles={["customer"]}><CustomerSettings /></ProtectedRoute>} />
              <Route path="/my-requests" element={<ProtectedRoute allowedRoles={["customer"]}><MyRequests /></ProtectedRoute>} />
              <Route path="/merchant-bookings" element={<ProtectedRoute allowedRoles={["merchant"]}><MerchantBookings /></ProtectedRoute>} />
              <Route path="/merchant-earnings" element={<ProtectedRoute allowedRoles={["merchant"]}><EarningsDashboard /></ProtectedRoute>} />
              <Route path="/merchant-marketing" element={<ProtectedRoute allowedRoles={["merchant"]}><MarketingTools /></ProtectedRoute>} />
              
              {/* Admin Routes */}
              <Route path="/admin-dashboard/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin-dashboard/events" element={<ProtectedRoute allowedRoles={["admin"]}><AdminEvents /></ProtectedRoute>} />
              <Route path="/admin-dashboard/utilities" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUtilities /></ProtectedRoute>} />
              <Route path="/admin-dashboard/profile" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProfile /></ProtectedRoute>} />
              <Route path="/admin-dashboard/event-monitoring" element={<ProtectedRoute allowedRoles={["admin"]}><AdminEventMonitoring /></ProtectedRoute>} />
              <Route path="/admin-dashboard/metrics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminMetrics /></ProtectedRoute>} />
              <Route path="/admin-dashboard/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin-dashboard/services" element={<ProtectedRoute allowedRoles={["admin"]}><AdminServices /></ProtectedRoute>} />
              <Route path="/admin-dashboard/payments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPayments /></ProtectedRoute>} />
              <Route path="/admin-dashboard/commissions" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCommissions /></ProtectedRoute>} />
              <Route path="/admin-dashboard/refunds" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRefunds /></ProtectedRoute>} />
              <Route path="/admin-dashboard/payouts" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPayouts /></ProtectedRoute>} />
              <Route path="/admin-dashboard/bookings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBookings /></ProtectedRoute>} />
              <Route path="/admin-dashboard/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReports /></ProtectedRoute>} />
              <Route path="/admin-dashboard/ai-recommendations" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRecommendations /></ProtectedRoute>} />
              <Route path="/admin-dashboard/language" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLanguage /></ProtectedRoute>} />
              <Route path="/create-event" element={<ProtectedRoute allowedRoles={["merchant"]}><CreateEvent /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
