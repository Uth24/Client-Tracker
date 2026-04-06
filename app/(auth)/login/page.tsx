import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Sign in
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Client Track dashboard
      </p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        No account?{" "}
        <Link
          href="/signup"
          className="font-medium text-zinc-900 underline dark:text-zinc-100"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
