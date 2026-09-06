import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./layout/AppLayout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import AuthProvider from "../features/auth/context/AuthProvider";

import HomePage from "../pages/HomePage";
import ApartmentsPage from "../pages/ApartmentsPage";
import ContactPage from "../pages/ContactPage";
import InfoPage from "../pages/InfoPage";
import ReservationsPage from "../features/reservations/pages/ReservationsPage";
import ReservationLinkPage from "../features/reservations/pages/ReservationLinkPage";
import AdminTagsPage from "../features/admin/tags/pages/AdminTagsPage";
import ApartmentDetailsPage from "../features/apartments/components/ApartmentDetailsPage";
import HostApartmentsPage from "../features/host/apartments/pages/HostApartmentsPage";
import CreateApartmentWizard from "../features/host/apartments/pages/CreateApartmentWizard";

function NotFoundPage() {
  return (
    <div className="container my-4">
      <h2 className="fw-bold">404</h2>
      <p className="text-muted mb-0">Page not found</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />

            <Route path="/apartments" element={<ApartmentsPage />} />

            <Route path="/apartments/:id" element={<ApartmentDetailsPage />} />

            <Route path="/contact" element={<ContactPage />} />

            <Route path="/help" element={<InfoPage page="help" />} />

            <Route path="/terms" element={<InfoPage page="terms" />} />

            <Route path="/privacy" element={<InfoPage page="privacy" />} />

            <Route
              path="/reservations"
              element={
                <ProtectedRoute>
                  <ReservationsPage scope="guest" />
                </ProtectedRoute>
              }
            />

            {/* Opened from a reservation mail. Not wrapped in ProtectedRoute:
                that would bounce to the home page and throw the token away,
                so the page asks for a sign in while keeping the url. */}
            <Route
              path="/reservations/link/:token"
              element={<ReservationLinkPage />}
            />

            <Route
              path="/host/reservations"
              element={
                <ProtectedRoute allowedRoles={["HOST"]}>
                  <ReservationsPage scope="host" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/tags"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminTagsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/host/apartments"
              element={
                <ProtectedRoute allowedRoles={["HOST"]}>
                  <HostApartmentsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/host/apartments/create"
              element={
                <ProtectedRoute allowedRoles={["HOST"]}>
                  <CreateApartmentWizard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}