import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import * as apartmentService from "../../../apartments/services/apartmentService";
import { getTags, type TagDto } from "../../../tags/services/tagService";
import type { ApartmentDetailsState } from "../steps/StepApartmentDetails";

export type CreateApartmentStepKey = "details" | "tags" | "photos";

export type CreateApartmentStep = {
  key: CreateApartmentStepKey;
  label: string;
};

function createInitialDetailsState(): ApartmentDetailsState {
  return {
    title: "",
    description: "",
    address: "",
    city: "",
    country: "",
    price_per_night: "",
    max_guests: "",
  };
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function useCreateApartmentWizard() {
  const navigate = useNavigate();

  const steps: CreateApartmentStep[] = useMemo(() => {
    return [
      { key: "details", label: "Apartment details" },
      { key: "tags", label: "Tags" },
      { key: "photos", label: "Photos" },
    ];
  }, []);

  const [stepIndex, setStepIndex] = useState<number>(0);
  const [details, setDetails] = useState<ApartmentDetailsState>(
    createInitialDetailsState
  );

  const [availableTags, setAvailableTags] = useState<TagDto[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [createdApartmentId, setCreatedApartmentId] = useState<number | null>(
    null
  );

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  const currentStep = steps[stepIndex];
  const currentStepKey = currentStep.key;
  const hasCreatedApartment = createdApartmentId !== null;

  useEffect(() => {
    if (currentStepKey !== "tags") {
      return;
    }

    let cancelled = false;

    async function loadTags() {
      try {
        setError(null);
        setBusy(true);

        const tags = await getTags();

        if (cancelled) {
          return;
        }

        setAvailableTags(tags);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(getErrorMessage(loadError, "Failed to load tags"));
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
  }, [currentStepKey]);

  function goPrev() {
    setError(null);

    setStepIndex((currentIndex) => {
      const previousIndex = currentIndex - 1;

      if (previousIndex < 0) {
        return 0;
      }

      return previousIndex;
    });
  }

  function canOpenStep(key: CreateApartmentStepKey) {
    if (key === "details") {
      return true;
    }

    if (key === "tags") {
      return true;
    }

    if (key === "photos" && hasCreatedApartment) {
      return true;
    }

    return false;
  }

  function goToStep(key: CreateApartmentStepKey) {
    if (!canOpenStep(key)) {
      return;
    }

    const nextIndex = steps.findIndex((step) => {
      return step.key === key;
    });

    if (nextIndex < 0) {
      return;
    }

    setError(null);
    setStepIndex(nextIndex);
  }

  function isStepActive(index: number) {
    return index === stepIndex;
  }

  function isStepDone(key: CreateApartmentStepKey) {
    if (key === "details" && stepIndex > 0) {
      return true;
    }

    if (key === "tags" && hasCreatedApartment) {
      return true;
    }

    return false;
  }

  function getStepButtonClassName(step: CreateApartmentStep, index: number) {
    const classNames = ["btn", "btn-sm", "rounded-pill"];

    if (isStepActive(index)) {
      classNames.push("btn-primary");
      return classNames.join(" ");
    }

    if (isStepDone(step.key)) {
      classNames.push("btn-outline-success");
      return classNames.join(" ");
    }

    classNames.push("btn-outline-secondary");
    return classNames.join(" ");
  }

  function handleNextFromDetails() {
    try {
      setError(null);
      validateDetails(details);
      setStepIndex(1);
    } catch (validationError) {
      setError(getErrorMessage(validationError, "Validation failed"));
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
      const id = Number(created.id);

      if (!Number.isFinite(id) || id <= 0) {
        throw new Error("Apartment created but no id returned from API.");
      }

      setCreatedApartmentId(id);
      setStepIndex(2);
    } catch (createError) {
      setError(getErrorMessage(createError, "Failed to create apartment"));
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    navigate(-1);
  }

  function handleFinish() {
    navigate("/host/apartments", { replace: true });
  }

  function clearError() {
    setError(null);
  }

  return {
    steps,
    stepIndex,
    currentStepKey,
    details,
    setDetails,
    availableTags,
    selectedTagIds,
    setSelectedTagIds,
    createdApartmentId,
    hasCreatedApartment,
    error,
    busy,
    setBusy,
    setError,
    goPrev,
    goToStep,
    canOpenStep,
    getStepButtonClassName,
    handleNextFromDetails,
    handleCreateWithTags,
    handleCancel,
    handleFinish,
    clearError,
  };
}