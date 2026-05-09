"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  type Vendor,
  type VendorImage,
  type VendorRelationshipStatus,
  type VendorServiceOption,
  sortVendorRow,
} from "@/lib/types/vendors";
import { formatClientError } from "@/lib/format-error";
import { replaceVendorServices } from "@/lib/vendors/replace-vendor-services";
import { uploadVendorImageFiles } from "@/lib/vendors/storage";
import { VENDOR_ROW_SELECT } from "@/lib/vendors/vendor-query-select";
import { SignedVendorImage } from "@/components/vendors/SignedVendorImage";
import { VendorPartnershipSegmented } from "@/components/vendors/VendorPartnershipSegmented";
import { Modal } from "@/components/ui/Modal";

export type VendorFormSavePayload =
  | { mode: "add"; vendor: Vendor }
  | {
      mode: "edit";
      vendor: Vendor;
      partnershipStatusChanged: boolean;
    };

type Props = {
  mode: "add" | "edit";
  vendor?: Vendor | null;
  open: boolean;
  onClose: () => void;
  onSaved: (payload: VendorFormSavePayload) => void;
};

function mergeServiceCatalog(
  fetched: VendorServiceOption[],
  vendor: Vendor | null,
): VendorServiceOption[] {
  const map = new Map<string, VendorServiceOption>();
  for (const o of fetched) map.set(o.id, o);
  if (vendor?.vendor_services) {
    for (const link of vendor.vendor_services) {
      const opt = link.vendor_service_options;
      if (opt?.id) map.set(opt.id, opt);
    }
  }
  return [...map.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

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
  const [website, setWebsite] = useState("");
  const [relationshipStatus, setRelationshipStatus] =
    useState<VendorRelationshipStatus>("havent_worked_with");
  const [serviceCatalog, setServiceCatalog] = useState<VendorServiceOption[]>(
    [],
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [newServiceLabel, setNewServiceLabel] = useState("");
  const [serviceAddInputOpen, setServiceAddInputOpen] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const newServiceInputRef = useRef<HTMLInputElement>(null);
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
  /** Partnership when edit modal opened (detect changes on save). */
  const relationshipAtOpenRef = useRef<VendorRelationshipStatus>(
    "havent_worked_with",
  );

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
      setWebsite(vendor.website?.trim() ?? "");
      setRelationshipStatus(vendor.relationship_status ?? "havent_worked_with");
      relationshipAtOpenRef.current =
        vendor.relationship_status ?? "havent_worked_with";
      setExistingImages([...(vendor.vendor_images ?? [])]);
      setSelectedServiceIds(
        new Set(
          (vendor.vendor_services ?? [])
            .map((l) => l.service_option_id)
            .filter(Boolean),
        ),
      );
    } else {
      setName("");
      setDescription("");
      setType("");
      setWebsite("");
      setRelationshipStatus("havent_worked_with");
      setExistingImages([]);
      setSelectedServiceIds(new Set());
    }
    setNewServiceLabel("");
    setServiceAddInputOpen(false);

    void (async () => {
      setCatalogLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCatalogLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("vendor_service_options")
        .select("*")
        .eq("user_id", user.id)
        .order("label");
      if (error) {
        setCatalogLoading(false);
        return;
      }
      const base = (data ?? []) as VendorServiceOption[];
      const merged =
        mode === "edit" && vendor
          ? mergeServiceCatalog(base, vendor)
          : base;
      setServiceCatalog(merged);
      setCatalogLoading(false);
    })();
    /* vendor?.id: re-run when switching edit target; entered is false if already open with same transition. */
  }, [open, mode, vendor?.id]);

  useEffect(() => {
    if (!open || !serviceAddInputOpen) return;
    const t = window.setTimeout(() => newServiceInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, serviceAddInputOpen]);

  function toggleServiceSelection(optionId: string) {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      return next;
    });
  }

  async function handleAddServiceOption() {
    const label = newServiceLabel.trim().replace(/\s+/g, " ");
    if (!label || addingService) return;
    setAddingService(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be signed in.");
        return;
      }
      const { data: created, error } = await supabase
        .from("vendor_service_options")
        .insert({ user_id: user.id, label })
        .select("*")
        .single();
      if (error) {
        const code = (error as { code?: string }).code;
        if (code === "23505") {
          const { data: existing } = await supabase
            .from("vendor_service_options")
            .select("*")
            .eq("user_id", user.id)
            .eq("label", label)
            .maybeSingle();
          if (existing) {
            setServiceCatalog((prev) =>
              mergeServiceCatalog([...prev, existing], null),
            );
            setSelectedServiceIds((prev) => new Set(prev).add(existing.id));
            setNewServiceLabel("");
            setServiceAddInputOpen(false);
            return;
          }
        }
        throw error;
      }
      if (created) {
        const opt = created as VendorServiceOption;
        setServiceCatalog((prev) =>
          mergeServiceCatalog([...prev, opt], null),
        );
        setSelectedServiceIds((prev) => new Set(prev).add(opt.id));
        setNewServiceLabel("");
        setServiceAddInputOpen(false);
      }
    } catch (err: unknown) {
      setError(formatClientError(err));
    } finally {
      setAddingService(false);
    }
  }

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
            website: website.trim() || null,
            relationship_status: relationshipStatus,
          })
          .select("id")
          .single();

        if (insErr) throw insErr;
        if (!row) throw new Error("No vendor returned");

        try {
          if (filesToUpload.length > 0) {
            const paths = await uploadVendorImageFiles(
              supabase,
              user.id,
              row.id,
              filesToUpload,
            );
            const rows = paths.map((image_url) => ({
              vendor_id: row.id,
              user_id: user.id,
              image_url,
            }));
            const { error: imgErr } = await supabase
              .from("vendor_images")
              .insert(rows);
            if (imgErr) throw imgErr;
          }
          await replaceVendorServices(supabase, row.id, [...selectedServiceIds]);
        } catch (imgFlowErr) {
          await supabase.from("vendors").delete().eq("id", row.id);
          throw imgFlowErr;
        }

        const { data: fullRow, error: loadErr } = await supabase
          .from("vendors")
          .select(VENDOR_ROW_SELECT)
          .eq("id", row.id)
          .single();

        if (loadErr) throw loadErr;
        if (!fullRow) throw new Error("Could not load new vendor");

        onSaved({
          mode: "add",
          vendor: sortVendorRow(fullRow as Vendor),
        });
      } else if (vendor) {
        const { error: upErr } = await supabase
          .from("vendors")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            type: type.trim() || null,
            website: website.trim() || null,
            relationship_status: relationshipStatus,
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
          const paths = await uploadVendorImageFiles(
            supabase,
            user.id,
            vendor.id,
            filesToUpload,
          );
          const rows = paths.map((image_url) => ({
            vendor_id: vendor.id,
            user_id: user.id,
            image_url,
          }));
          const { error: imgErr } = await supabase
            .from("vendor_images")
            .insert(rows);
          if (imgErr) throw imgErr;
        }

        await replaceVendorServices(supabase, vendor.id, [...selectedServiceIds]);

        const { data: fullRow, error: loadErr } = await supabase
          .from("vendors")
          .select(VENDOR_ROW_SELECT)
          .eq("id", vendor.id)
          .single();

        if (loadErr) throw loadErr;
        if (!fullRow) throw new Error("Could not load vendor after save");

        const updated = sortVendorRow(fullRow as Vendor);
        const newRel = updated.relationship_status ?? "havent_worked_with";
        const partnershipStatusChanged =
          newRel !== relationshipAtOpenRef.current;

        onSaved({
          mode: "edit",
          vendor: updated,
          partnershipStatusChanged,
        });
      }

      onClose();
    } catch (err: unknown) {
      setError(formatClientError(err));
    } finally {
      setSaving(false);
    }
  }

  const title = mode === "add" ? "Add vendor" : "Edit vendor";

  return (
    <Modal open={open} onClose={onClose} title={title} size="2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
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

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 shadow-sm ring-1 ring-zinc-100/80">
          <label
            htmlFor="vendor-type"
            className="block text-sm font-medium text-zinc-800"
          >
            Type / category
          </label>
          <p className="mt-0.5 text-xs text-zinc-500">
            The vendor&apos;s main bucket (e.g. contractor, property manager).
            Specific work types go under Services offered below.
          </p>
          <input
            id="vendor-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <div>
          <label
            htmlFor="vendor-website"
            className="block text-sm font-medium text-zinc-700"
          >
            Company website
          </label>
          <p className="mt-0.5 text-xs text-zinc-500">
            Optional. Paste a full URL or just the domain (e.g.{" "}
            <span className="font-mono text-zinc-600">acme.com</span>).
          </p>
          <input
            id="vendor-website"
            type="text"
            inputMode="url"
            autoComplete="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/35 p-4 shadow-sm ring-1 ring-sky-100/60">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">
              Services Offered
            </h3>
            {catalogLoading ? (
              <span className="text-xs text-zinc-500">Loading…</span>
            ) : null}
          </div>
          <div
            className="mt-3 flex max-h-[11.5rem] flex-wrap content-start gap-2 overflow-y-auto"
            role="group"
            aria-label="Services offered"
          >
            {catalogLoading ? null : serviceCatalog.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No services yet—use{" "}
                <span className="font-medium text-zinc-700">+ Add Service</span>{" "}
                to create your first chip.
              </p>
            ) : (
              serviceCatalog.map((opt) => {
                const on = selectedServiceIds.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={on}
                    disabled={saving}
                    onClick={() => toggleServiceSelection(opt.id)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      on
                        ? "bg-sky-600 text-white shadow-sm ring-1 ring-sky-700/30 hover:bg-sky-700"
                        : "bg-white text-zinc-700 ring-1 ring-zinc-200/90 hover:bg-zinc-50 hover:ring-zinc-300"
                    } disabled:pointer-events-none disabled:opacity-50`}
                  >
                    {opt.label}
                  </button>
                );
              })
            )}
            {!catalogLoading ? (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setServiceAddInputOpen((v) => {
                    const next = !v;
                    if (v) setNewServiceLabel("");
                    return next;
                  })
                }
                className="rounded-full border border-dashed border-zinc-300 bg-white/80 px-3.5 py-1.5 text-sm font-medium text-zinc-600 hover:border-sky-300 hover:bg-sky-50/80 hover:text-sky-800 disabled:opacity-50"
              >
                + Add Service
              </button>
            ) : null}
          </div>
          {serviceAddInputOpen ? (
            <div className="mt-3 space-y-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <input
                  ref={newServiceInputRef}
                  id="vendor-new-service"
                  type="text"
                  value={newServiceLabel}
                  onChange={(e) => setNewServiceLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleAddServiceOption();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setNewServiceLabel("");
                      setServiceAddInputOpen(false);
                    }
                  }}
                  placeholder="Type a service name…"
                  disabled={saving || addingService}
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-300"
                  aria-label="New service name — press Enter to add"
                />
                {addingService ? (
                  <span className="shrink-0 text-xs text-zinc-500">Saving…</span>
                ) : null}
              </div>
              <p className="text-xs text-zinc-500">
                Press{" "}
                <kbd className="rounded bg-zinc-200/90 px-1 py-0.5 font-mono text-[10px] font-semibold text-zinc-800">
                  Enter
                </kbd>{" "}
                to add this service.{" "}
                <kbd className="rounded bg-zinc-200/90 px-1 py-0.5 font-mono text-[10px] font-semibold text-zinc-800">
                  Esc
                </kbd>{" "}
                to cancel.
              </p>
            </div>
          ) : null}
        </div>

        <VendorPartnershipSegmented
          value={relationshipStatus}
          onChange={(next) => {
            if (next !== "all") setRelationshipStatus(next);
          }}
          ariaLabel="Partnership Status"
          disabled={saving}
          hint={
            mode === "add"
              ? "After you add this vendor, we’ll switch to this tab and highlight the new row."
              : undefined
          }
        />
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
              <span className="text-sm text-zinc-500">No files chosen yet</span>
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
                      marked ? "border-red-500 opacity-50" : "border-zinc-200"
                    }`}
                  >
                    <SignedVendorImage
                      imageRef={img.image_url}
                      className="h-full w-full"
                      imgClassName="h-full w-full object-cover"
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
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
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
            className="inline-flex min-w-[10.5rem] items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:pointer-events-none disabled:opacity-60"
          >
            {saving ? (
              <>
                <span
                  className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/35 border-t-white"
                  aria-hidden
                />
                {mode === "add" ? "Adding vendor…" : "Saving changes…"}
              </>
            ) : (
              saveButtonLabel
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
