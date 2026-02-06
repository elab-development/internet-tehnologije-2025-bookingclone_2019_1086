import React from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  id: number;
  name: string;
  country: string;
  city: string;
  imageUrl: string;
};

export default function ApartmentCard({ id, name, country, city, imageUrl }: Props) {
  const navigate = useNavigate();

  function openDetails() {
    navigate(`/apartments/${id}`);
  }

  return (
    <div
      className="card h-100 shadow-sm border-0 rounded-4"
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter") openDetails();
      }}
      style={{ cursor: "pointer" }}
    >
      <div className="position-relative">
        <img
          src={imageUrl}
          className="card-img-top rounded-top-4"
          alt={name}
          style={{ height: 200, objectFit: "cover" }}
        />

        {/* IMPORTANT: prevent clicking heart from opening details */}
        <button
          className="btn btn-light position-absolute top-0 end-0 m-2 rounded-circle shadow-sm"
          style={{ width: 36, height: 36 }}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: wishlist later
          }}
        >
          ❤️
        </button>
      </div>

      <div className="card-body d-flex flex-column">
        <h5 className="card-title fw-bold mb-1">{name}</h5>
        <p className="text-muted mb-2">
          {country}, {city}
        </p>

        <div className="mt-auto d-flex align-items-center gap-2">
          <span className="badge bg-primary rounded-2 px-2 py-1">10</span>
          <span className="fw-semibold">Exceptional</span>
        </div>
      </div>
    </div>
  );
}