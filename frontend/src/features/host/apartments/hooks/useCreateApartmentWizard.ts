import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import * as apartmentService from "../../../apartments/services/apartmentService";
import { getTags, type TagDto } from "../../../tags/services/tagService";
import type { ApartmentDetailsState } from "../steps/StepApartmentDetails";

import {
  CREATE_APARTMENT_STEPS,
  type CreateApartmentStep,
  type CreateApartmentStepKey,
} from "../constants/createApartmentSteps";

import {
  createInitialDetailsState,
  getErrorMessage,
  validateApartmentDetails,
} from "../utils/apartmentDetailsValidation";

import { createApartmentPayload } from "../utils/createApartmentPayload";

export function useCreateApartmentWizard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const steps = CREATE_APARTMENT_STEPS;

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

  function getValidationMessages() {
    return {
      requiredFields: t("createApartment.errors.requiredFields"),
      invalidPrice: t("createApartment.errors.invalidPrice"),
      invalidGuests: t("createApartment.errors.invalidGuests"),
    };
  }

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

        setError(
          getErrorMessage(loadError, t("createApartment.errors.loadTagsFailed"))
        );
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
  }, [currentStepKey, t]);

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
      validateApartmentDetails(details, getValidationMessages());
      setStepIndex(1);
    } catch (validationError) {
      setError(
        getErrorMessage(validationError, t("createApartment.errors.validationFailed"))
      );
    }
  }

  async function handleCreateWithTags() {
    try {
      setError(null);
      setBusy(true);

      validateApartmentDetails(details, getValidationMessages());

      const payload = createApartmentPayload(details, selectedTagIds);
      const created = await apartmentService.createApartment(payload);
      const id = Number(created.id);

      if (!Number.isFinite(id) || id <= 0) {
        throw new Error(t("createApartment.errors.missingApartmentId"));
      }

      setCreatedApartmentId(id);
      setStepIndex(2);
    } catch (createError) {
      setError(
        getErrorMessage(createError, t("createApartment.errors.createFailed"))
      );
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