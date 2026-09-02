import React, { useRef, useState } from 'react';
import { Upload, X, Check, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { mediaApi } from '../../services/api';

export interface ImageUploadProps {
  label?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  helperText?: string;
  placeholderText?: string;
  aspectRatio?: 'square' | 'wide' | 'auto';
  className?: string;
  maxSizeMB?: number;
  folder?: 'logos' | 'templates' | 'tournaments' | 'avatars' | 'general';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value,
  onChange,
  helperText,
  placeholderText = 'Click or drag image to upload',
  aspectRatio: _aspectRatio = 'square',
  className = '',
  maxSizeMB = 10,
  folder = 'general',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload to Cloudinary via server backend API
      const uploadRes = await mediaApi.uploadImage(file, folder);

      if (uploadRes.success && uploadRes.url) {
        onChange(uploadRes.url);
        setIsUploading(false);
        return;
      }

      // 2. Offline / Local fallback to DataURL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read image file.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      // Offline fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`w-full space-y-1.5 font-sans ${className}`}>
      {label && (
        <label className="block text-xs sm:text-[13px] font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono">
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {isUploading ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-4 flex items-center justify-center gap-3 text-xs font-mono text-[var(--accent-primary)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Uploading image to Cloudinary...</span>
        </div>
      ) : value ? (
        <div className="relative group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] p-2.5 flex items-center justify-between gap-3 shadow-[var(--shadow-flat)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-lg bg-black/40 border border-[var(--border-subtle)] overflow-hidden shrink-0 flex items-center justify-center p-1">
              <img
                src={value}
                alt="Upload preview"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[var(--text-primary)] font-mono flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[var(--status-live)]" />
                Image Uploaded
              </div>
              <span className="text-[11px] text-[var(--text-muted)] font-mono block truncate">
                {value.startsWith('http') ? 'Stored on Cloudinary' : 'Ready for high-res rendering'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              type="button"
              variant="danger"
              size="xs"
              onClick={handleRemove}
              leftIcon={<X className="h-3 w-3" />}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer p-4 text-center flex flex-col items-center justify-center gap-2 select-none ${
            isDragging
              ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-md'
              : 'border-[var(--border-medium)] bg-[var(--bg-surface-inset)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-surface-hover)]'
          }`}
        >
          <div className="h-10 w-10 rounded-xl bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] text-[var(--accent-primary)] flex items-center justify-center shadow-inner">
            <Upload className="h-5 w-5" />
          </div>

          <div className="space-y-0.5">
            <div className="text-xs font-bold text-[var(--text-primary)] font-display">
              {placeholderText}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              PNG, JPG, WEBP or SVG up to {maxSizeMB}MB
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-[var(--status-danger)] font-medium">{error}</p>}
      {helperText && !error && <p className="text-xs text-[var(--text-secondary)]">{helperText}</p>}
    </div>
  );
};
