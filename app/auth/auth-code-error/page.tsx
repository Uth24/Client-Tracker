import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-lg font-semibold text-zinc-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          We couldn&apos;t complete sign-in. Try again, or confirm Google OAuth
          redirect URLs in Supabase (e.g.{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs">
            /auth/callback
          </code>
          ).
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
