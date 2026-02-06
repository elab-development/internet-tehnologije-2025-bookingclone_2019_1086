import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as apartmentService from "../../services/apartmentService";

/** Step components */
import StepApartmentDetails, { ApartmentDetailsState } from "./steps/StepApartmentDetails";
import StepApartmentTags, { TagDto } from "./steps/StepApartmentTags";
import StepApartmentPhotos from "./steps/StepApartmentPhotos";

type StepKey = "details" | "tags" | "photos";

export default function CreateApartmentWizard() {
  const navigate = useNavigate();

  const steps: { key: StepKey; label: string }[] = useMemo(
    () => [
      { key: "details", label: "Apartment details" },
      { key: "tags", label: "Tags" },
      { key: "photos", label: "Photos" },
    ],
    []
  );

  const [stepIndex, setStepIndex] = useState<number>(0);

  // Step 1 state
  const [details, setDetails] = useState<ApartmentDetailsState>({
    title: "",
    description: "",
    address: "",
    city: "",
    country: "",
    price_per_night: "",
    max_guests: "",
  });

  // Step 2 state
  const [availableTags, setAvailableTags] = useState<TagDto[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  // Created apartment id (after step 2 success)
  const [createdApartmentId, setCreatedApartmentId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const current = steps[stepIndex]?.key;

  // Load tags when we enter step 2
  useEffect(() => {
    if (current !== "tags") return;

    let cancelled = false;

    async function loadTags() {
      try {
        setError(null);
        setBusy(true);

        // ✅ Replace this with your real tags service if you already have it.
        // For now, you can hardcode tags or fetch from an endpoint.
        // Example assumes GET /tags exists:
        const res = await fetch("http://localhost:8000/tags", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Failed to load tags (${res.status})`);
        }

        const tags = (await res.json()) as TagDto[];
        if (!cancelled) setAvailableTags(tags);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load tags";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    loadTags();
    return () => {
      cancelled = true;
    };
  }, [current]);

  function goPrev() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function goToStep(key: StepKey) {
    // allow jumping only to completed/allowed steps
    // - photos only allowed after create (createdApartmentId exists)
    if (key === "photos" && !createdApartmentId) return;
    setError(null);
    setStepIndex(steps.findIndex((s) => s.key === key));
  }

  function validateDetails(d: ApartmentDetailsState) {
    const title = d.title.trim();
    const description = d.description.trim();
    const address = d.address.trim();
    const city = d.city.trim();
    const country = d.country.trim();

    if (!title || !description || !address || !city || !country) {
      throw new Error("All fields are required.");
    }

    const price = Number(d.price_per_night);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Price per night must be a positive number.");
    }

    const guests = Number(d.max_guests);
    if (!Number.isFinite(guests) || guests < 1) {
      throw new Error("Max guests must be at least 1.");
    }
  }

  async function handleNextFromDetails() {
    try {
      setError(null);
      validateDetails(details);
      setStepIndex(1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Validation failed";
      setError(msg);
    }
  }

  async function handleCreateWithTags() {
    try {
      setError(null);
      setBusy(true);

      validateDetails(details);

      const payload: apartmentService.ApartmentCreateRequest = {
        title: details.title.trim(),
        description: details.description.trim(),
        address: details.address.trim(),
        city: details.city.trim(),
        country: details.country.trim(),
        price_per_night: Number(details.price_per_night),
        max_guests: Number(details.max_guests),
        tag_ids: selectedTagIds,
      };

      const created = await apartmentService.createApartment(payload);

      // You said your backend returns json; we assume it includes id.
      const id = Number(created?.id);
      if (!Number.isFinite(id)) {
        throw new Error("Apartment created but no id returned from API.");
      }

      setCreatedApartmentId(id);
      setStepIndex(2);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create apartment";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleFinish() {
    navigate("/host/apartments", { replace: true });
  }

  return (
    <div className="container my-4" style={{ maxWidth: 950 }}>
      <div className="mb-3">
        <h2 className="fw-bold mb-1">Create apartment</h2>
        <div className="text-muted">Complete all steps to publish your listing</div>
      </div>

      {/* Stepper header */}
      <div className="card border-0 shadow-sm rounded-4 mb-3">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {steps.map((s, idx) => {
              const isActive = idx === stepIndex;
              const isDone =
                (s.key === "details" && stepIndex > 0) ||
                (s.key === "tags" && createdApartmentId !== null) ||
                (s.key === "photos" && createdApartmentId !== null && stepIndex > 2);

              const canClick =
                s.key === "details" ||
                s.key === "tags" ||
                (s.key === "photos" && createdApartmentId !== null);

              return (
                <button
                  key={s.key}
                  type="button"
                  className={
                    "btn btn-sm rounded-pill " +
                    (isActive ? "btn-primary" : isDone ? "btn-outline-success" : "btn-outline-secondary")
                  }
                  onClick={() => (canClick ? goToStep(s.key) : null)}
                  disabled={!canClick}
                >
                  {idx + 1}. {s.label}
                </button>
              );
            })}
            <div className="ms-auto text-muted small">
              {createdApartmentId ? (
                <>Apartment ID: <span className="fw-semibold">{createdApartmentId}</span></>
              ) : (
                <>Not created yet</>
              )}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      {/* Content */}
      {current === "details" ? (
        <StepApartmentDetails
          value={details}
          onChange={setDetails}
          busy={busy}
          onNext={handleNextFromDetails}
          onCancel={() => navigate(-1)}
        />
      ) : null}

      {current === "tags" ? (
        <StepApartmentTags
          availableTags={availableTags}
          selectedTagIds={selectedTagIds}
          onChangeSelectedTagIds={setSelectedTagIds}
          busy={busy}
          onPrev={goPrev}
          onCreate={handleCreateWithTags}
          onCancel={() => navigate(-1)}
        />
      ) : null}

      {current === "photos" ? (
        <StepApartmentPhotos
          apartmentId={createdApartmentId!}
          busy={busy}
          setBusy={setBusy}
          setError={setError}
          onPrev={goPrev}
          onFinish={handleFinish}
        />
      ) : null}
    </div>
  );
}
