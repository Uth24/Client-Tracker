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
    <div className="flex min-h-full flex-1 items-center justify-center bg-[#e8e5e0] px-4 py-10">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 lg:flex-row">
        {/* Blank left / top panel — placeholder for future art */}
        <div
          className="h-44 w-full shrink-0 bg-zinc-100 lg:hidden"
          aria-hidden
        />
        <div
          className="hidden min-h-[520px] w-[52%] bg-zinc-100 lg:block"
          aria-hidden
        />
        <div className="flex w-full flex-1 flex-col justify-center px-8 py-12 sm:px-12 lg:max-w-[48%] lg:py-16">
          {children}
        </div>
      </div>
    </div>
  );
}
