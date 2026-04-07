import Link from "next/link";
import { AuthBrand } from "@/components/auth/AuthBrand";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <AuthBrand />
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-zinc-900">
        Nice to see you again
      </h1>
      <LoginForm />
      <p className="mt-8 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Sign up now
        </Link>
      </p>
      <p className="mt-10 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} Client Track
      </p>
    </div>
  );
}
