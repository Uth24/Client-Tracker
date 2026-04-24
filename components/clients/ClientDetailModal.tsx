"use client";

import type { Client } from "@/lib/types/clients";
import { Modal } from "@/components/ui/Modal";

type Props = {
  client: Client | null;
  open: boolean;
  onClose: () => void;
};

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

export function ClientDetailModal({ client, open, onClose }: Props) {
  if (!client) return null;

  const addressParts = [
    client.address_line1,
    client.address_line2,
    [client.city, client.state, client.zip_code].filter((x) => x?.trim()).join(", "),
  ].filter((x) => x?.trim());
  const address = addressParts.join("\n");

  return (
    <Modal open={open} onClose={onClose} title={client.name} size="lg">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Email
            </p>
            <p className="mt-1 text-zinc-800">
              {client.email?.trim() ? client.email : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Phone
            </p>
            <p className="mt-1 text-zinc-800">
              {client.phone?.trim() ? client.phone : "—"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Address
          </p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-800">
            {address.trim() ? address : "—"}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Notes
          </p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-800">
            {client.notes?.trim() ? client.notes : "—"}
          </p>
        </div>
        <p className="text-xs text-zinc-500">
          Added {formatDate(client.created_at)}
        </p>
      </div>
    </Modal>
  );
}

