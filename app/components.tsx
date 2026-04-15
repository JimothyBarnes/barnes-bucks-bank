import Link from "next/link";
import { logoutAction } from "@/app/actions";
import type { TransactionSummary } from "@/lib/data";
import { formatBucks, formatDate, titleCase } from "@/lib/format";

const isPreviewMode = Boolean(process.env.BARNES_BUCKS_DB_PATH);

export const inputClass =
  "w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-[15px] outline-none transition focus:border-[var(--navy)] focus:ring-2 focus:ring-[rgba(18,58,104,0.16)]";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:brightness-105";

export const ghostButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--navy)]";

export const dangerButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[var(--red)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105";

export const disabledButtonClass =
  "inline-flex items-center justify-center rounded-full bg-gray-300 px-5 py-3 text-sm font-semibold text-gray-600";

export function Shell({
  children,
  title,
  subtitle,
  message,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  message?: string;
}) {
  return (
    <main className="min-h-screen px-4 py-6 text-[var(--ink)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] px-6 py-8 shadow-[0_24px_80px_rgba(18,58,104,0.08)] backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <p className="inline-flex rounded-full border border-[rgba(200,159,52,0.3)] bg-[rgba(200,159,52,0.16)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gold-deep)]">
              Barnes Bucks National Bank
            </p>
            {isPreviewMode ? (
              <p className="inline-flex rounded-full border border-[rgba(188,76,60,0.3)] bg-[rgba(188,76,60,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--red)]">
                Preview Mode
              </p>
            ) : null}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-base text-[var(--muted)] sm:text-lg">{subtitle}</p>
          {isPreviewMode ? (
            <div className="mt-5 rounded-2xl border border-[rgba(188,76,60,0.24)] bg-[rgba(188,76,60,0.08)] px-4 py-3 text-sm font-medium text-[var(--red)]">
              You are using the safe preview database. Changes here do not affect your normal local app or your live Render site.
            </div>
          ) : null}
          {message ? (
            <div className="mt-5 rounded-2xl border border-[rgba(14,143,91,0.25)] bg-[rgba(14,143,91,0.1)] px-4 py-3 text-sm font-medium text-[var(--green)]">
              {message}
            </div>
          ) : null}
        </header>
        {children}
      </div>
    </main>
  );
}

export function AdminShell({
  children,
  title,
  subtitle,
  message,
  activeTab,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  message?: string;
  activeTab: "dashboard" | "jobs" | "settings";
}) {
  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      detail: "Daily banking",
      key: "dashboard",
    },
    {
      href: "/admin/jobs",
      label: "Jobs",
      detail: "Approvals and posting",
      key: "jobs",
    },
    {
      href: "/admin/settings",
      label: "Settings",
      detail: "Accounts and rewards",
      key: "settings",
    },
  ] as const;

  return (
    <Shell title={title} subtitle={subtitle} message={message}>
      <div className="mb-6 flex flex-col gap-4 rounded-[1.5rem] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(18,58,104,0.06),rgba(255,255,255,0.82))] px-4 py-4 shadow-[0_18px_50px_rgba(18,58,104,0.08)] lg:flex-row lg:items-center lg:justify-between">
        <nav className="grid gap-3 sm:grid-cols-3">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`rounded-[1.25rem] border px-4 py-3 transition ${
                item.key === activeTab
                  ? "border-[rgba(18,58,104,0.28)] bg-[var(--navy)] text-white shadow-[0_16px_36px_rgba(18,58,104,0.2)]"
                  : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--navy)]"
              }`}
            >
              <span className="block text-base font-semibold">{item.label}</span>
              <span
                className={`mt-1 block text-xs uppercase tracking-[0.18em] ${
                  item.key === activeTab ? "text-white/75" : "text-[var(--muted)]"
                }`}
              >
                {item.detail}
              </span>
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="lg:shrink-0">
          <button className={ghostButtonClass}>Sign Out</button>
        </form>
      </div>
      {children}
    </Shell>
  );
}

export function Card({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <section
      className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[0_18px_50px_rgba(18,58,104,0.08)] backdrop-blur"
      style={accent ? { borderColor: accent } : undefined}
    >
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "gold" | "green";
}) {
  const toneStyles =
    tone === "gold"
      ? "bg-[linear-gradient(145deg,rgba(200,159,52,0.16),rgba(255,255,255,0.8))]"
      : tone === "green"
        ? "bg-[linear-gradient(145deg,rgba(14,143,91,0.14),rgba(255,255,255,0.8))]"
        : "bg-[linear-gradient(145deg,rgba(18,58,104,0.08),rgba(255,255,255,0.84))]";

  return (
    <div className={`rounded-[1.5rem] border border-[var(--line)] p-4 ${toneStyles}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      {detail ? <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p> : null}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.55)] px-4 py-6 text-sm text-[var(--muted)]">
      {text}
    </div>
  );
}

export function LedgerRow({
  entry,
  userId,
}: {
  entry: TransactionSummary;
  userId?: number;
}) {
  const incoming = userId ? entry.toUserId === userId : Boolean(entry.toUserId);
  const sign = incoming ? "+" : "-";
  const tone = incoming ? "text-[var(--green)]" : "text-[var(--red)]";

  return (
    <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">
            {titleCase(entry.type)}
            {entry.jobTitle ? ` - ${entry.jobTitle}` : ""}
            {entry.rewardTitle ? ` - ${entry.rewardTitle}` : ""}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {entry.fromName ? `From ${entry.fromName}` : ""}
            {entry.fromName && entry.toName ? " to " : ""}
            {entry.toName ? entry.toName : ""}
            {entry.actorName ? ` - Posted by ${entry.actorName}` : ""}
          </p>
          {entry.note ? <p className="mt-1 text-sm">{entry.note}</p> : null}
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold ${tone}`}>
            {sign}
            {formatBucks(entry.amount)}
          </p>
          <p className="text-xs text-[var(--muted)]">{formatDate(entry.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
