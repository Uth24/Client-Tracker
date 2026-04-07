"use client";

import { useId, useState } from "react";

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  placeholder?: string;
};

export function PasswordField({
  id: idProp,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  minLength,
  required = true,
  placeholder = "Enter password",
}: Props) {
  const uid = useId();
  const id = idProp ?? uid;
  const [show, setShow] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-zinc-500"
      >
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border-0 bg-zinc-100 px-3.5 py-3 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-700"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}
