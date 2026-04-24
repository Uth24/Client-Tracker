"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Vendor, VendorImage } from "@/lib/types/vendors";
import { VENDOR_IMAGES_BUCKET } from "@/lib/constants";
import { formatClientError } from "@/lib/format-error";
import { uploadVendorImageFiles } from "@/lib/vendors/storage";
import { Modal } from "@/components/ui/Modal";

type Props = {
  mode: "add" | "edit";
  vendor?: Vendor | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

/** Local previews + clear copy: files are not uploaded until the form is saved. */
function PendingImageQueue({
  files,
  onRemove,
  saveButtonLabel,
}: {
  files: File[];
  onRemove: (index: number) => void;
  saveButtonLabel: string;
}) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [urls]);

  if (files.length === 0) return null;

  return (
    <div
      className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50 p-4"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-sky-900">
        {files.length} photo{files.length === 1 ? "" : "s"} ready to upload
      </p>
      <p className="mt-1 text-xs leading-relaxed text-sky-900/80">
        Choosing files only stages them here. They are sent to Supabase Storage
        and saved to <span className="font-medium">vendor_images</span> when you
        click{" "}
        <span className="font-semibold">&quot;{saveButtonLabel}&quot;</span>.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {files.map((f, i) => (
          <div
            key={`${f.name}-${f.size}-${i}`}
            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urls[i]} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute right-1 top-1 rounded-lg bg-zinc-950/60 px-1.5 py-0.5 text-xs font-semibold text-white hover:bg-zinc-950/75"
            >
              Remove
            </button>
            <span className="absolute bottom-0 left-0 right-0 truncate bg-black/55 px-1 py-0.5 text-[10px] text-white">
              {f.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VendorFormModal({
  mode,
  vendor,
  open,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<VendorImage[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputId = useId();
  /** Tracks whether the dialog was already open (avoids clearing staged files on parent re-renders). */
  const wasOpenRef = useRef(false);
  /** Always matches staged files — submit reads this so uploads never use a stale empty array. */
  const newFilesRef = useRef<File[]>([]);

  const saveButtonLabel = mode === "add" ? "Add vendor" : "Save";

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    const entered = !wasOpenRef.current;
    wasOpenRef.current = true;

    /* Only reset when open transitions false → true, not when vendor[] or router.refresh() re-renders. */
    if (!entered) return;

    setError(null);
    setNewFiles([]);
    newFilesRef.current = [];
    setRemovedIds(new Set());

    if (mode === "edit" && vendor) {
      setName(vendor.name);
      setDescription(vendor.description ?? "");
      setType(vendor.type ?? "");
      setExistingImages([...(vendor.vendor_images ?? [])]);
    } else {
      setName("");
      setDescription("");
      setType("");
      setExistingImages([]);
    }
    /* vendor?.id: re-run when switching edit target; entered is false if already open with same transition. */
  }, [open, mode, vendor?.id]);

  function toggleRemoveImage(id: string) {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list?.length) return;
    const picked = Array.from(list);
    setNewFiles((prev) => {
      const next = [...prev, ...picked];
      newFilesRef.current = next;
      return next;
    });
    e.target.value = "";
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      newFilesRef.current = next;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
      return;
    }

    setSaving(true);
    const filesToUpload = newFilesRef.current.slice();

    try {
      if (mode === "add") {
        const { data: row, error: insErr } = await supabase
          .from("vendors")
          .insert({
            user_id: user.id,
            name: name.trim(),
            description: description.trim() || null,
            type: type.trim() || null,
          })
          .select()
          .single();

        if (insErr) throw insErr;
        if (!row) throw new Error("No vendor returned");

        try {
          if (filesToUpload.length > 0) {
            const urls = await uploadVendorImageFiles(
              supabase,
              user.id,
              row.id,
              filesToUpload,
            );
            const rows = urls.map((image_url) => ({
              vendor_id: row.id,
              user_id: user.id,
              image_url,
            }));
            const { error: imgErr } = await supabase
              .from("vendor_images")
              .insert(rows);
            if (imgErr) throw imgErr;
          }
        } catch (imgFlowErr) {
          await supabase.from("vendors").delete().eq("id", row.id);
          throw imgFlowErr;
        }
      } else if (vendor) {
        const { error: upErr } = await supabase
          .from("vendors")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            type: type.trim() || null,
          })
          .eq("id", vendor.id);

        if (upErr) throw upErr;

        const toDelete = [...removedIds];
        if (toDelete.length > 0) {
          const { error: delErr } = await supabase
            .from("vendor_images")
            .delete()
            .in("id", toDelete);
          if (delErr) throw delErr;
        }

        if (filesToUpload.length > 0) {
          const urls = await uploadVendorImageFiles(
            supabase,
            user.id,
            vendor.id,
            filesToUpload,
          );
          const rows = urls.map((image_url) => ({
            vendor_id: vendor.id,
            user_id: user.id,
            image_url,
          }));
          const { error: imgErr } = await supabase
            .from("vendor_images")
            .insert(rows);
          if (imgErr) throw imgErr;
        }
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(formatClientError(err));
    } finally {
      setSaving(false);
    }
  }

  const title = mode === "add" ? "Add vendor" : "Edit vendor";

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="vendor-name"
            className="block text-sm font-medium text-zinc-700"
          >
            Name
          </label>
          <input
            id="vendor-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
          />
        </div>
        <div>
          <label
            htmlFor="vendor-type"
            className="block text-sm font-medium text-zinc-700"
          >
            Type / category
          </label>
          <input
            id="vendor-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
          />
        </div>
        <div>
          <label
            htmlFor="vendor-desc"
            className="block text-sm font-medium text-zinc-700"
          >
            Description
          </label>
          <textarea
            id="vendor-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-zinc-700">
            Images
          </span>
          {/* <p className="mt-0.5 text-xs text-zinc-500">
            Bucket{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
              {VENDOR_IMAGES_BUCKET}
            </code>
            . If upload fails, run{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
              supabase/storage-setup.sql
            </code>{" "}
            in the Supabase SQL editor.
          </p> */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/*
              Overlay the real <input type="file"> on the visible control. Programmatic
              input.click() from a separate button is blocked or flaky in Safari and some
              browsers; a direct click on the input (even opacity-0) is treated as user intent.
            */}
            <label className="relative inline-flex min-h-[42px] min-w-[132px] cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 shadow-sm ring-1 ring-zinc-100 hover:bg-zinc-50">
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                multiple
                onChange={onFileChange}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                style={{ fontSize: 0 }}
              />
              <span className="pointer-events-none text-sm font-semibold text-zinc-800">
                Choose files
              </span>
            </label>
            {newFiles.length > 0 ? (
              <span className="text-sm font-semibold text-emerald-700">
                {newFiles.length} file{newFiles.length === 1 ? "" : "s"} staged
              </span>
            ) : (
              <span className="text-sm text-zinc-500">
                No Images chosen yet
              </span>
            )}
          </div>
        </div>

        <PendingImageQueue
          files={newFiles}
          onRemove={removeNewFile}
          saveButtonLabel={saveButtonLabel}
        />

        {mode === "edit" && existingImages.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-zinc-700">
              Current images (toggle to remove on save)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {existingImages.map((img) => {
                const marked = removedIds.has(img.id);
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => toggleRemoveImage(img.id)}
                    className={`relative h-16 w-24 overflow-hidden rounded-xl border-2 text-left ${
                      marked
                        ? "border-red-500 opacity-50"
                        : "border-zinc-200"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    {marked ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
                        Remove
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : saveButtonLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
