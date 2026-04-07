import Link from "next/link";
import { AuthBrand } from "@/components/auth/AuthBrand";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      <AuthBrand />
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-zinc-900">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Start tracking vendors in one place.
      </p>
      <SignupForm />
      <p className="mt-8 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
      <p className="mt-10 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} Client Track
      </p>
    </div>
  );
}
