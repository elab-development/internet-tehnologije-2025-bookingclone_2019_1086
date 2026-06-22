import React from "react";

export type ApartmentDetailsState = {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  price_per_night: string;
  max_guests: string;
};

export default function StepApartmentDetails(props: {
  value: ApartmentDetailsState;
  onChange: (next: ApartmentDetailsState) => void;
  busy: boolean;
  onNext: () => void;
  onCancel: () => void;
}) {
  const { value, onChange, busy, onNext, onCancel } = props;

  function onFieldChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    onChange({
      ...value,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">Step 1: Apartment details</h5>
        <div className="text-muted mb-3">Fill in basic information</div>

        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold">Title *</label>
            <input
              name="title"
              value={value.title}
              onChange={onFieldChange}
              className="form-control"
              placeholder="e.g. Cozy apartment in city center"
              required
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">Description *</label>
            <textarea
              name="description"
              value={value.description}
              onChange={onFieldChange}
              className="form-control"
              rows={5}
              placeholder="Describe your apartment..."
              required
            />
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">Address *</label>
            <input
              name="address"
              value={value.address}
              onChange={onFieldChange}
              className="form-control"
              placeholder="Street and number"
              required
            />
          </div>

          <div className="col-md-6 col-12">
            <label className="form-label fw-semibold">City *</label>
            <input
              name="city"
              value={value.city}
              onChange={onFieldChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6 col-12">
            <label className="form-label fw-semibold">Country *</label>
            <input
              name="country"
              value={value.country}
              onChange={onFieldChange}
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6 col-12">
            <label className="form-label fw-semibold">Price per night *</label>
            <input
              name="price_per_night"
              value={value.price_per_night}
              onChange={onFieldChange}
              className="form-control"
              placeholder="e.g. 50"
              inputMode="decimal"
              required
            />
          </div>

          <div className="col-md-6 col-12">
            <label className="form-label fw-semibold">Max guests *</label>
            <input
              name="max_guests"
              value={value.max_guests}
              onChange={onFieldChange}
              className="form-control"
              placeholder="e.g. 4"
              inputMode="numeric"
              required
            />
          </div>
        </div>

        <div className="d-flex gap-2 mt-4">
          <button
            type="button"
            className="btn btn-primary px-4"
            onClick={onNext}
            disabled={busy}
          >
            Next
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
