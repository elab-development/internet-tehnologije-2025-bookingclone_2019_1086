import React, { useEffect, useMemo, useState } from "react";
import * as apartmentService from "../../../services/apartmentService";

type PendingItem = {
  id: string;
  file: File;
  previewUrl: string;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function StepApartmentPhotos(props: {
  apartmentId: number;
  busy: boolean;
  setBusy: (b: boolean) => void;
  setError: (e: string | null) => void;
  onPrev: () => void;
  onFinish: () => void;
}) {
  const { apartmentId, busy, setBusy, setError, onPrev, onFinish } = props;

  const [pending, setPending] = useState<PendingItem[]>([]);
  const [uploaded, setUploaded] = useState<apartmentService.ApartmentPhotoDto[]>([]);

  // Clean up blob URLs
  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;

    const items: PendingItem[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      items.push({
        id: uid(),
        file: f,
        previewUrl: URL.createObjectURL(f),
      });
    }

    setPending((prev) => [...prev, ...items]);
  }

  function removePending(id: string) {
    setPending((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }

  function clearAll() {
    setPending((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return [];
    });
  }

  const finishDisabled = useMemo(() => pending.length === 0 || busy, [pending.length, busy]);

  async function finishAndUpload() {
    try {
      setError(null);

      if (pending.length === 0) {
        throw new Error("Please add at least one photo before finishing.");
      }

      setBusy(true);

      const files = pending.map((p) => p.file);

      // ✅ ONLY HERE we call the backend
      const created = await apartmentService.uploadApartmentPhotos(apartmentId, files);

      // show what backend returned (optional)
      setUploaded(created);

      // clear staged files
      clearAll();

      // navigate away (or keep them on page if you want)
      onFinish();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to upload photos";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">Step 3: Photos</h5>
        <div className="text-muted mb-3">
          Add photos locally, then click <span className="fw-semibold">Finish</span> to upload them.
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
          <input
            type="file"
            className="form-control"
            accept="image/*"
            multiple
            onChange={(e) => addFiles(e.target.files)}
            disabled={busy}
            style={{ maxWidth: 420 }}
          />

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={clearAll}
            disabled={busy || pending.length === 0}
          >
            Clear
          </button>
        </div>

        {/* Pending (local only) */}
        {pending.length === 0 ? (
          <div className="text-muted mb-4">No photos selected yet.</div>
        ) : (
          <div className="mb-4">
            <div className="fw-semibold mb-2">Selected photos (not uploaded yet)</div>

            <div className="row g-3">
              {pending.map((p) => (
                <div key={p.id} className="col-12 col-md-6 col-lg-4">
                  <div className="card rounded-4 h-100">
                    <img
                      src={p.previewUrl}
                      alt={p.file.name}
                      className="card-img-top"
                      style={{ height: 160, objectFit: "cover" }}
                    />
                    <div className="card-body">
                      <div className="small fw-semibold text-truncate">{p.file.name}</div>
                      <div className="small text-muted">
                        {(p.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>

                      <div className="d-flex gap-2 mt-3">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removePending(p.id)}
                          disabled={busy}
                        >
                          Remove
                        </button>

                        <div className="ms-auto small text-muted">staged</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded preview (optional) */}
        {uploaded.length > 0 ? (
          <div className="mb-4">
            <div className="fw-semibold mb-2">Uploaded (backend returned)</div>
            <div className="small text-muted">Uploaded {uploaded.length} photo(s).</div>
          </div>
        ) : null}

        <div className="d-flex gap-2 mt-2">
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
            className="btn btn-primary px-4 ms-auto"
            onClick={finishAndUpload}
            disabled={finishDisabled}
            title={pending.length === 0 ? "Add at least one photo first" : ""}
          >
            {busy ? "Uploading..." : "Finish"}
          </button>
        </div>

        <div className="text-muted small mt-3">
          Finish uploads everything in one request:{" "}
          <span className="fw-semibold">POST /apartments/{apartmentId}/photos</span>
        </div>
      </div>
    </div>
  );
}
