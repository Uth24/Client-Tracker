import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Create account
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Start tracking vendors
      </p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
