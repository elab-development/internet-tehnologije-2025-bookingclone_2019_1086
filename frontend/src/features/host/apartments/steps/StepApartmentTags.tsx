import { useTranslation } from "react-i18next";

import type { TagDto } from "../../../tags/services/tagService";
import WizardStepActions from "./components/WizardStepActions";
import WizardStepShell from "./components/WizardStepShell";

import "../styles/ApartmentWizardSteps.css";

type StepApartmentTagsProps = {
  availableTags: TagDto[];
  selectedTagIds: number[];
  onChangeSelectedTagIds: (ids: number[]) => void;
  busy: boolean;
  onPrev: () => void;
  onCreate: () => void;
  onCancel: () => void;
};

export default function StepApartmentTags({
  availableTags,
  selectedTagIds,
  onChangeSelectedTagIds,
  busy,
  onPrev,
  onCreate,
  onCancel,
}: StepApartmentTagsProps) {
  const { t } = useTranslation();

  function toggleTag(id: number) {
    if (selectedTagIds.includes(id)) {
      const nextSelectedTagIds = selectedTagIds.filter((selectedId) => {
        return selectedId !== id;
      });

      onChangeSelectedTagIds(nextSelectedTagIds);
      return;
    }

    onChangeSelectedTagIds([...selectedTagIds, id]);
  }

  function isTagSelected(id: number) {
    return selectedTagIds.includes(id);
  }

  function getTagButtonClass(id: number) {
    const baseClass = "btn w-100 apartment-wizard-step__tag-button";

    if (isTagSelected(id)) {
      return `${baseClass} btn-success`;
    }

    return `${baseClass} btn-outline-secondary`;
  }

  function getCreateButtonText() {
    if (busy) {
      return t("createApartment.actions.creating");
    }

    return t("createApartment.actions.createApartment");
  }

  function renderEmptyTagsMessage() {
    if (availableTags.length > 0) {
      return null;
    }

    return (
      <div className="apartment-wizard-step__empty-text">
        {t("createApartment.tags.empty")}
      </div>
    );
  }

  function renderTagsGrid() {
    if (availableTags.length === 0) {
      return null;
    }

    return (
      <div className="apartment-wizard-step__tags-grid">
        {availableTags.map((tag) => {
          return (
            <button
              key={tag.id}
              type="button"
              className={getTagButtonClass(tag.id)}
              onClick={() => toggleTag(tag.id)}
              disabled={busy}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <WizardStepShell
      title={t("createApartment.tags.title")}
      subtitle={t("createApartment.tags.subtitle")}
    >
      {renderEmptyTagsMessage()}
      {renderTagsGrid()}

      <WizardStepActions>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onPrev}
          disabled={busy}
        >
          {t("createApartment.actions.back")}
        </button>

        <button
          type="button"
          className="btn btn-primary px-4"
          onClick={onCreate}
          disabled={busy}
        >
          {getCreateButtonText()}
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary apartment-wizard-step__actions-spacer"
          onClick={onCancel}
          disabled={busy}
        >
          {t("createApartment.actions.cancel")}
        </button>
      </WizardStepActions>
    </WizardStepShell>
  );
}