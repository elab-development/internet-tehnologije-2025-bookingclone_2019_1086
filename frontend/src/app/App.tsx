import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./layout/AppLayout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import HomePage from "../pages/HomePage";
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
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/apartments/:id" element={<ApartmentDetailsPage />} />

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
  );
}