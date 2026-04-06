"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export function SignOutButton({ className, children }: Props) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className={
        className ??
        "text-left text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      }
    >
      {children ?? "Log out"}
    </button>
  );
}
