"use client";

import type { Lead } from "@/lib/types/leads";
import { Modal } from "@/components/ui/Modal";
import { SignedLeadImage } from "@/components/leads/SignedLeadImage";

type Props = {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
};

function websiteHref(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function LeadDetailModal({ lead, open, onClose }: Props) {
  if (!lead) return null;

  const images = lead.lead_images ?? [];

  return (
    <Modal open={open} onClose={onClose} title={lead.name} size="xl">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Type of work
          </p>
          <p className="mt-0.5 text-zinc-900">
            {lead.type?.trim() ? lead.type : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Website
          </p>
          {lead.website?.trim() ? (
            <a
              href={websiteHref(lead.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
            >
              {lead.website.trim()}
              <span className="shrink-0 text-xs font-normal text-zinc-400">
                ↗
              </span>
            </a>
          ) : (
            <p className="mt-0.5 text-zinc-600">—</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Services offered
          </p>
          {(() => {
            const links = (lead.lead_services ?? []).filter(
              (l) => l.lead_service_options?.label?.trim(),
            );
            if (links.length === 0) {
              return <p className="mt-0.5 text-zinc-600">—</p>;
            }
            return (
              <ul className="mt-2 flex flex-wrap gap-2">
                {links.map((l) => (
                  <li
                    key={l.service_option_id}
                    className="rounded-full bg-sky-600/10 px-3 py-1 text-sm font-medium text-sky-900 ring-1 ring-sky-200"
                  >
                    {l.lead_service_options!.label}
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Description
          </p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-800">
            {lead.description?.trim()
              ? lead.description
              : "No description."}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Images
          </p>
          {images.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-500">No images yet.</p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {images.map((img) => (
                <SignedLeadImage
                  key={img.id}
                  imageRef={img.image_url}
                  withLink
                  className="aspect-video overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
                  imgClassName="h-full w-full object-cover"
                />
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          Added {formatDate(lead.created_at)}
        </p>
      </div>
    </Modal>
  );
}
