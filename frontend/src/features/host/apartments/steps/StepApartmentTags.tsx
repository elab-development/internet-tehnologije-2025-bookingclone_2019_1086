import React from "react";

import type { TagDto } from "../../../tags/services/tagService";

export default function StepApartmentTags(props: {
  availableTags: TagDto[];
  selectedTagIds: number[];
  onChangeSelectedTagIds: (ids: number[]) => void;
  busy: boolean;
  onPrev: () => void;
  onCreate: () => void;
  onCancel: () => void;
}) {
  const {
    availableTags,
    selectedTagIds,
    onChangeSelectedTagIds,
    busy,
    onPrev,
    onCreate,
    onCancel,
  } = props;

  function toggleTag(id: number) {
    if (selectedTagIds.includes(id)) {
      onChangeSelectedTagIds(selectedTagIds.filter((x) => x !== id));
      return;
    }

    onChangeSelectedTagIds([...selectedTagIds, id]);
  }

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">Step 2: Tags</h5>

        <div className="text-muted mb-3">
          Select tags, then we will create the apartment.
        </div>

        {availableTags.length === 0 ? (
          <div className="text-muted">No tags loaded.</div>
        ) : (
          <div className="row g-2">
            {availableTags.map((tag) => {
              const checked = selectedTagIds.includes(tag.id);

              return (
                <div key={tag.id} className="col-12 col-md-6 col-lg-4">
                  <button
                    type="button"
                    className={
                      "btn w-100 text-start rounded-3 " +
                      (checked ? "btn-success" : "btn-outline-secondary")
                    }
                    onClick={() => toggleTag(tag.id)}
                    disabled={busy}
                  >
                    {tag.name}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="d-flex gap-2 mt-4">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onPrev}
            disabled={busy}
          >
            Back
          </button>

          <button
            type="button"
            className="btn btn-primary px-4"
            onClick={onCreate}
            disabled={busy}
          >
            {busy ? "Creating..." : "Create apartment"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary ms-auto"
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