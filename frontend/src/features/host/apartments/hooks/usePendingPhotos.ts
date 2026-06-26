import { useEffect, useRef, useState } from "react";

export type PendingPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

function createPhotoId(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${index}`;
}

function revokePhotoPreview(photo: PendingPhoto) {
  URL.revokeObjectURL(photo.previewUrl);
}

function createPendingPhoto(file: File, index: number): PendingPhoto {
  return {
    id: createPhotoId(file, index),
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

export function formatFileSize(size: number) {
  const sizeInMb = size / 1024 / 1024;
  return `${sizeInMb.toFixed(2)} MB`;
}

export function usePendingPhotos() {
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const pendingPhotosRef = useRef<PendingPhoto[]>([]);

  useEffect(() => {
    pendingPhotosRef.current = pendingPhotos;
  }, [pendingPhotos]);

  useEffect(() => {
    return () => {
      pendingPhotosRef.current.forEach((photo) => {
        revokePhotoPreview(photo);
      });
    };
  }, []);

  function addFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const nextPhotos = Array.from(fileList).map((file, index) => {
      return createPendingPhoto(file, index);
    });

    setPendingPhotos((currentPendingPhotos) => {
      return [...currentPendingPhotos, ...nextPhotos];
    });
  }

  function removePendingPhoto(id: string) {
    setPendingPhotos((currentPendingPhotos) => {
      const itemToRemove = currentPendingPhotos.find((photo) => {
        return photo.id === id;
      });

      if (itemToRemove) {
        revokePhotoPreview(itemToRemove);
      }

      return currentPendingPhotos.filter((photo) => {
        return photo.id !== id;
      });
    });
  }

  function clearPendingPhotos() {
    setPendingPhotos((currentPendingPhotos) => {
      currentPendingPhotos.forEach((photo) => {
        revokePhotoPreview(photo);
      });

      return [];
    });
  }

  function hasPendingPhotos() {
    return pendingPhotos.length > 0;
  }

  function getPendingFiles() {
    return pendingPhotos.map((photo) => {
      return photo.file;
    });
  }

  return {
    pendingPhotos,
    addFiles,
    removePendingPhoto,
    clearPendingPhotos,
    hasPendingPhotos,
    getPendingFiles,
  };
}