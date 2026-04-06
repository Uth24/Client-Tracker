import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/vendors");

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
