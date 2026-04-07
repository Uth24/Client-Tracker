export function AuthBrand() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 via-amber-300 to-sky-500 shadow-sm"
        aria-hidden
      />
      <span className="text-xl font-bold tracking-tight text-zinc-900">
        Client Track
      </span>
    </div>
  );
}
