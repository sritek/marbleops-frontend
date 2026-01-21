"use client";

import * as React from "react";
import { Plus, X, ImageIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  storageKey?: string;
  className?: string;
}

/**
 * Photo upload component with multi-photo support
 * Stores images as base64 in localStorage temporarily
 */
export function PhotoUpload({
  photos,
  onChange,
  maxPhotos = 5,
  storageKey = "inventory_photos_temp",
  className,
}: PhotoUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load photos from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored && photos.length === 0) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onChange(parsed);
        }
      } catch {
        // Invalid stored data, ignore
      }
    }
  }, [storageKey]);

  // Save photos to localStorage when they change
  React.useEffect(() => {
    if (photos.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(photos));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [photos, storageKey]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    const newPhotos: string[] = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) continue;

      // Convert to base64
      const base64 = await fileToBase64(file);
      newPhotos.push(base64);
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
  };

  const clearAllPhotos = () => {
    onChange([]);
    localStorage.removeItem(storageKey);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Photos
          </CardTitle>
          {photos.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllPhotos}
              className="text-text-muted hover:text-error h-7 text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
        <p className="text-xs text-text-muted">
          {photos.length}/{maxPhotos} photos added
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload button */}
        {canAddMore && (
          <Button
            type="button"
            variant="secondary"
            className="w-full h-24 border-2 border-dashed border-border-subtle hover:border-primary-600 flex flex-col gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-6 w-6 text-text-muted" />
            <span className="text-sm text-text-muted">
              Click to add photos
            </span>
          </Button>
        )}

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-bg-app group"
              >
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error"
                >
                  <X className="h-3 w-3" />
                </button>
                {/* Photo number badge */}
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-xs font-medium bg-black/60 text-white rounded">
                  {index + 1}
                </span>
              </div>
            ))}

            {/* Add more button in grid */}
            {canAddMore && photos.length > 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-border-subtle hover:border-primary-600 flex items-center justify-center transition-colors"
              >
                <Plus className="h-8 w-8 text-text-muted" />
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {photos.length === 0 && (
          <div className="text-center py-4">
            <ImageIcon className="h-12 w-12 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">No photos added yet</p>
            <p className="text-xs text-text-muted mt-1">
              Add up to {maxPhotos} photos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Clear temporary photo storage
 */
export function clearPhotoStorage(storageKey = "inventory_photos_temp") {
  localStorage.removeItem(storageKey);
}
