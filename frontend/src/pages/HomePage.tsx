import React from "react";
import ApartmentList from "../components/apartments/ApartmentList";

export default function HomePage() {
  return (
    <>
      {/* Hero section */}
      <div className="bg-light py-5 border-bottom">
        <div className="container">
          <h2 className="fw-bold mb-2">
            Find your next stay
          </h2>
          <p className="text-muted mb-0">
            Search deals on hotels, homes, and much more
          </p>
        </div>
      </div>

      {/* Apartment list */}
      <div className="container my-4">
        <ApartmentList />
      </div>
    </>
  );
}
