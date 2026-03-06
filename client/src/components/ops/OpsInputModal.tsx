"use client";

import { useEffect, useState } from "react";

type OpsInputModalProps = {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  required?: boolean;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void | Promise<void>;
};

export default function OpsInputModal({
  open,
  title,
  description,
  label,
  placeholder,
  defaultValue = "",
  confirmLabel = "Submit",
  cancelLabel = "Cancel",
  required = false,
  submitting = false,
  onClose,
  onConfirm,
}: OpsInputModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
    }
  }, [open, defaultValue]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  if (!open) return null;

  const trimmed = value.trim();
  const disableConfirm = submitting || (required && trimmed.length === 0);

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-xl rounded-3xl border border-[#efe5d8] bg-white p-6 shadow-[0_30px_80px_rgba(20,18,14,0.3)]">
        <h3 className="text-xl font-semibold text-[#2a2927]">{title}</h3>
        {description && <p className="mt-1 text-sm text-[#6b6b6b]">{description}</p>}

        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#7a6f63]">
            {label}
          </label>
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            rows={4}
            className="mt-2 w-full resize-none rounded-2xl border border-[#e3d6c4] bg-white px-4 py-3 text-sm text-[#2a2927] outline-none transition focus:border-[#1f7a6b]"
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-[#d9ccbb] px-4 py-2 text-sm font-semibold text-[#6b5f53] transition hover:bg-[#f6efe6] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={disableConfirm}
            onClick={() => onConfirm(value)}
            className="rounded-full bg-[#2a2927] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1f1e1c] disabled:opacity-60"
          >
            {submitting ? "Saving..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

