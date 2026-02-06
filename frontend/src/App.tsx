import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import HostApartmentsPage from "./pages/host/HostApartmentsPage";
import CreateApartmentWizard from "./pages/host/CreateApartmentWizard";

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

          {/* HOST */}
          <Route path="/host/apartments" element={<HostApartmentsPage />} />
          <Route path="/host/apartments/create" element={<CreateApartmentWizard />} />

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
