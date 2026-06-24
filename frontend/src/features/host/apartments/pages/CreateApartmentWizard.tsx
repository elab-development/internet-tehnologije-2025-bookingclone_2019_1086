import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import * as apartmentService from "../../../apartments/services/apartmentService";
import { getTags, type TagDto } from "../../../tags/services/tagService";

import StepApartmentDetails, {
  ApartmentDetailsState,
} from "../steps/StepApartmentDetails";

import StepApartmentTags from "../steps/StepApartmentTags";

import StepApartmentPhotos from "../steps/StepApartmentPhotos";

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

  const [details, setDetails] = useState<ApartmentDetailsState>({
    title: "",
    description: "",
    address: "",
    city: "",
    country: "",
    price_per_night: "",
    max_guests: "",
  });

  const [availableTags, setAvailableTags] = useState<TagDto[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [createdApartmentId, setCreatedApartmentId] = useState<number | null>(
    null
  );

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const current = steps[stepIndex]?.key;

  useEffect(() => {
    if (current !== "tags") {
      return;
    }

    let cancelled = false;

    async function loadTags() {
      try {
        setError(null);
        setBusy(true);

        const tags = await getTags();

        if (!cancelled) {
          setAvailableTags(tags);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load tags";

        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setBusy(false);
        }
      }
    }

    loadTags();

    return () => {
      cancelled = true;
    };
  }, [current]);

  function goPrev() {
    setError(null);
    setStepIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  function goToStep(key: StepKey) {
    if (key === "photos" && !createdApartmentId) {
      return;
    }

    setError(null);
    setStepIndex(steps.findIndex((step) => step.key === key));
  }

  function validateDetails(value: ApartmentDetailsState) {
    const title = value.title.trim();
    const description = value.description.trim();
    const address = value.address.trim();
    const city = value.city.trim();
    const country = value.country.trim();

    if (!title || !description || !address || !city || !country) {
      throw new Error("All fields are required.");
    }

    const price = Number(value.price_per_night);

    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Price per night must be a positive number.");
    }

    const guests = Number(value.max_guests);

    if (!Number.isFinite(guests) || guests < 1) {
      throw new Error("Max guests must be at least 1.");
    }
  }

  async function handleNextFromDetails() {
    try {
      setError(null);
      validateDetails(details);
      setStepIndex(1);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Validation failed";

      setError(message);
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

      const id = Number(created?.id);

      if (!Number.isFinite(id)) {
        throw new Error("Apartment created but no id returned from API.");
      }

      setCreatedApartmentId(id);
      setStepIndex(2);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create apartment";

      setError(message);
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

        <div className="text-muted">
          Complete all steps to publish your listing
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-3">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {steps.map((step, index) => {
              const isActive = index === stepIndex;

              const isDone =
                (step.key === "details" && stepIndex > 0) ||
                (step.key === "tags" && createdApartmentId !== null);

              const canClick =
                step.key === "details" ||
                step.key === "tags" ||
                (step.key === "photos" && createdApartmentId !== null);

              return (
                <button
                  key={step.key}
                  type="button"
                  className={
                    "btn btn-sm rounded-pill " +
                    (isActive
                      ? "btn-primary"
                      : isDone
                      ? "btn-outline-success"
                      : "btn-outline-secondary")
                  }
                  onClick={() => goToStep(step.key)}
                  disabled={!canClick}
                >
                  {index + 1}. {step.label}
                </button>
              );
            })}

            <div className="ms-auto text-muted small">
              {createdApartmentId ? (
                <>
                  Apartment ID:{" "}
                  <span className="fw-semibold">{createdApartmentId}</span>
                </>
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