export default function DashboardPage() {
  return (
    <div className="relative -m-6 min-h-[calc(100vh-4rem)] bg-zinc-950 p-6 text-white lg:-m-8 lg:p-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[15%] top-[10%] h-[520px] w-[520px] rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="absolute right-[10%] top-[20%] h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-[5%] left-[40%] h-[520px] w-[520px] rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-white/60">Client Track</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-white/55">
              With all of the styling tool options available in today’s market
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PillButton>Last 30 days</PillButton>
            <PillButton variant="primary">Export</PillButton>
          </div>
        </div>

        <section className="mt-7">
          <p className="text-xs font-semibold tracking-[0.2em] text-white/55">
            WALLETS
          </p>
          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            <WalletCard
              accent="from-cyan-400/70 to-blue-500/60"
              label="BTC"
              value="1.9678"
              delta="+12.5%"
              deltaTone="up"
            />
            <WalletCard
              accent="from-violet-400/70 to-fuchsia-500/60"
              label="ETH"
              value="23.234"
              delta="-4.23%"
              deltaTone="down"
            />
            <WalletCard
              accent="from-emerald-400/60 to-cyan-400/50"
              label="LTC"
              value="380.234"
              delta="+3.80%"
              deltaTone="up"
            />
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <section className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/85">Activity</p>
                <p className="mt-0.5 text-sm text-white/50">
                  Balance trends across wallets
                </p>
              </div>
              <div className="flex items-center gap-2">
                <LegendDot color="bg-cyan-400" label="BTC" />
                <LegendDot color="bg-violet-400" label="ETH" />
                <LegendDot color="bg-emerald-400" label="LTC" />
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-gradient-to-b from-white/5 to-transparent p-4 ring-1 ring-white/10">
              <Chart />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Total balance" value="$107,543.23" />
              <MiniStat label="Monthly change" value="+8.3%" tone="up" />
              <MiniStat label="Risk score" value="Low" />
            </div>
          </section>

          <section className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white/85">
                Notifications
              </p>
              <button
                type="button"
                className="text-sm font-medium text-white/55 hover:text-white"
              >
                See all
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <NotificationItem
                name="Clifford Hale"
                message="Has the new pricing plan been useful?"
                time="2 hours ago"
              />
              <NotificationItem
                name="Lottie Marsh"
                message="Sent you a new vendor invite."
                time="5 hours ago"
              />
              <NotificationItem
                name="BTC"
                message="Price moved +39.69% — trade now."
                time="8 hours ago"
                badge="+39.69%"
              />
              <NotificationItem
                name="Danny Jacobs"
                message="Sent you a message."
                time="11 hours ago"
              />
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-white/85">History</p>
              <div className="mt-3 space-y-2">
                <HistoryRow
                  title="Aktarnya Joko bayar utang"
                  amount="+0.020"
                  date="08/26/2018"
                  tone="up"
                />
                <HistoryRow
                  title="Cicilan mobil"
                  amount="-0.323"
                  date="08/26/2018"
                  tone="down"
                />
                <HistoryRow
                  title="Buat beli susu anak"
                  amount="-5.239"
                  date="08/26/2018"
                  tone="down"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function PillButton({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant?: "primary";
}) {
  const base =
    "rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-white/10 transition";
  const style =
    variant === "primary"
      ? "bg-white/10 text-white hover:bg-white/15"
      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white";
  return <button className={`${base} ${style}`}>{children}</button>;
}

function WalletCard({
  accent,
  label,
  value,
  delta,
  deltaTone,
}: {
  accent: string;
  label: string;
  value: string;
  delta: string;
  deltaTone: "up" | "down";
}) {
  const deltaClass =
    deltaTone === "up"
      ? "text-emerald-300 bg-emerald-400/10 ring-emerald-400/20"
      : "text-rose-300 bg-rose-400/10 ring-rose-400/20";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/5 p-5 ring-1 ring-white/10">
      <div className={`absolute inset-0 opacity-70`}>
        <div
          className={`absolute -left-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br ${accent} blur-2xl`}
        />
      </div>
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
              <CoinIcon />
            </div>
            <p className="text-sm font-semibold text-white/80">{label}</p>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${deltaClass}`}
        >
          {delta}
        </span>
      </div>
      <div className="relative mt-4">
        <SparkLine tone={deltaTone} />
      </div>
    </div>
  );
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white/80">
      <path
        d="M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.9"
      />
      <path
        d="M9.25 8.75h3.25a2 2 0 0 1 0 4H10m0 0h3.25a2 2 0 0 1 0 4H9.25M10 6.8v10.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

function SparkLine({ tone }: { tone: "up" | "down" }) {
  const stroke = tone === "up" ? "#34d399" : "#fb7185";
  return (
    <svg viewBox="0 0 120 36" className="h-9 w-full">
      <defs>
        <linearGradient id="slg" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={stroke} stopOpacity="0.05" />
          <stop offset="1" stopColor={stroke} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <path
        d="M2 26 C 18 18, 30 30, 46 22 C 58 16, 70 18, 82 12 C 94 6, 106 12, 118 8"
        fill="none"
        stroke={stroke}
        strokeWidth="2.2"
        opacity="0.95"
      />
      <path
        d="M2 26 C 18 18, 30 30, 46 22 C 58 16, 70 18, 82 12 C 94 6, 106 12, 118 8 L 118 36 L 2 36 Z"
        fill="url(#slg)"
      />
    </svg>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs font-medium text-white/55">{label}</span>
    </div>
  );
}

function Chart() {
  return (
    <div className="relative">
      <div className="grid grid-cols-6 gap-2 text-[11px] text-white/35">
        <span>8.5k</span>
        <span />
        <span />
        <span />
        <span />
        <span className="text-right">4.5k</span>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl">
        <svg viewBox="0 0 720 260" className="h-56 w-full">
          <defs>
            <linearGradient id="g1" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#22d3ee" stopOpacity="0.2" />
              <stop offset="1" stopColor="#22d3ee" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="g2" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#a78bfa" stopOpacity="0.2" />
              <stop offset="1" stopColor="#a78bfa" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="g3" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#34d399" stopOpacity="0.15" />
              <stop offset="1" stopColor="#34d399" stopOpacity="0.85" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g opacity="0.28" stroke="#ffffff" strokeWidth="1">
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={i}
                x1={0}
                x2={720}
                y1={20 + i * 40}
                y2={20 + i * 40}
              />
            ))}
          </g>

          <path
            d="M10 190 C 90 140, 160 200, 240 150 C 320 100, 380 120, 460 80 C 540 40, 610 120, 710 60"
            fill="none"
            stroke="url(#g2)"
            strokeWidth="3"
            filter="url(#glow)"
            opacity="0.9"
          />
          <path
            d="M10 200 C 90 180, 160 210, 240 190 C 320 165, 380 180, 460 140 C 540 110, 610 170, 710 130"
            fill="none"
            stroke="url(#g1)"
            strokeWidth="3"
            filter="url(#glow)"
            opacity="0.85"
          />
          <path
            d="M10 215 C 90 210, 160 230, 240 205 C 320 190, 380 210, 460 175 C 540 155, 610 195, 710 170"
            fill="none"
            stroke="url(#g3)"
            strokeWidth="2.6"
            filter="url(#glow)"
            opacity="0.8"
          />

          <g>
            <circle cx="520" cy="105" r="10" fill="#ffffff" opacity="0.12" />
            <circle cx="520" cy="105" r="5" fill="#f472b6" opacity="0.95" />
            <circle cx="520" cy="105" r="18" fill="#f472b6" opacity="0.08" />
            <line
              x1="520"
              x2="520"
              y1="0"
              y2="260"
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.12"
            />
          </g>
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-7 text-[11px] text-white/35">
        <span>12:58PM</span>
        <span className="text-center">1:25AM</span>
        <span className="text-center">7:58AM</span>
        <span className="text-center">11:59AM</span>
        <span className="text-center">2:38AM</span>
        <span className="text-center">4:58AM</span>
        <span className="text-right">6:38AM</span>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up";
}) {
  return (
    <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <p className="text-xs font-semibold tracking-[0.18em] text-white/45">
        {label.toUpperCase()}
      </p>
      <p
        className={
          tone === "up"
            ? "mt-1 text-lg font-semibold text-emerald-300"
            : "mt-1 text-lg font-semibold text-white/85"
        }
      >
        {value}
      </p>
    </div>
  );
}

function NotificationItem({
  name,
  message,
  time,
  badge,
}: {
  name: string;
  message: string;
  time: string;
  badge?: string;
}) {
  const initial = name.slice(0, 1).toUpperCase();
  const isSymbol = name.length <= 4 && name === name.toUpperCase();
  return (
    <div className="flex gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/5 ring-1 ring-white/10">
        {isSymbol ? (
          <span className="text-xs font-semibold text-white/70">{initial}</span>
        ) : (
          <span className="h-7 w-7 rounded-full bg-gradient-to-br from-fuchsia-500/70 to-cyan-400/60 ring-1 ring-white/10" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white/80">{name}</p>
          {badge ? (
            <span className="shrink-0 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-white/55">{message}</p>
        <p className="mt-1 text-xs text-white/40">{time}</p>
      </div>
    </div>
  );
}

function HistoryRow({
  title,
  amount,
  date,
  tone,
}: {
  title: string;
  amount: string;
  date: string;
  tone: "up" | "down";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white/75">{title}</p>
        <p className="text-xs text-white/40">{date}</p>
      </div>
      <p
        className={
          tone === "up"
            ? "text-sm font-semibold text-emerald-300"
            : "text-sm font-semibold text-rose-300"
        }
      >
        {amount}
      </p>
    </div>
  );
}
