"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Vendor, VendorImage } from "@/lib/types/vendors";
import { uploadVendorImageFiles } from "@/lib/vendors/storage";
import { Modal } from "@/components/ui/Modal";

type Props = {
  mode: "add" | "edit";
  vendor?: Vendor | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

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

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNewFiles([]);
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
  }, [open, mode, vendor]);

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
    setNewFiles((prev) => [...prev, ...Array.from(list)]);
    e.target.value = "";
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
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

        if (newFiles.length > 0) {
          const urls = await uploadVendorImageFiles(
            supabase,
            user.id,
            row.id,
            newFiles,
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

        if (newFiles.length > 0) {
          const urls = await uploadVendorImageFiles(
            supabase,
            user.id,
            vendor.id,
            newFiles,
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
      setError(err instanceof Error ? err.message : "Something went wrong");
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
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Name
          </label>
          <input
            id="vendor-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label
            htmlFor="vendor-type"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Type / category
          </label>
          <input
            id="vendor-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label
            htmlFor="vendor-desc"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description
          </label>
          <textarea
            id="vendor-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <p className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Images
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Upload multiple files. Stored in Supabase Storage (
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
              vendor-images
            </code>
            ).
          </p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            className="mt-2 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-900 dark:text-zinc-400 dark:file:bg-zinc-800 dark:file:text-zinc-100"
          />
        </div>

        {mode === "edit" && existingImages.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
                    className={`relative h-16 w-24 overflow-hidden rounded-lg border-2 text-left ${
                      marked
                        ? "border-red-500 opacity-50"
                        : "border-zinc-200 dark:border-zinc-600"
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

        {newFiles.length > 0 ? (
          <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {newFiles.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-2 py-1 dark:bg-zinc-800"
              >
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  className="shrink-0 text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
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
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saving ? "Saving…" : mode === "add" ? "Add vendor" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
