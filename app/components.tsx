import Link from "next/link";
import { logoutAction } from "@/app/actions";
import type { TransactionSummary } from "@/lib/data";
import { formatBucks, formatDate, titleCase } from "@/lib/format";

const isPreviewMode = Boolean(process.env.BARNES_BUCKS_DB_PATH);

export const inputClass =
  "w-full rounded-[1.1rem] border border-[rgba(18,58,104,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,246,239,0.92))] px-4 py-3 text-[15px] text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_10px_22px_rgba(18,58,104,0.05)] outline-none transition placeholder:text-[color:rgba(92,102,117,0.64)] focus:border-[rgba(18,58,104,0.28)] focus:ring-2 focus:ring-[rgba(18,58,104,0.12)]";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[rgba(10,28,52,0.22)] bg-[linear-gradient(180deg,#163f70,#0d2d52)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(10,28,52,0.22),inset_0_1px_0_rgba(255,255,255,0.14)] transition hover:translate-y-[-1px] hover:brightness-105";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[rgba(138,101,16,0.18)] bg-[linear-gradient(180deg,#e0bb5d,#c89f34)] px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_16px_34px_rgba(200,159,52,0.24),inset_0_1px_0_rgba(255,255,255,0.24)] transition hover:translate-y-[-1px] hover:brightness-105";

export const ghostButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[rgba(18,58,104,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,243,235,0.9))] px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_12px_24px_rgba(18,58,104,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:border-[rgba(18,58,104,0.22)] hover:translate-y-[-1px]";

export const dangerButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[var(--red)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(188,76,60,0.18)] transition hover:brightness-105";

export const disabledButtonClass =
  "inline-flex items-center justify-center rounded-full bg-gray-300 px-5 py-3 text-sm font-semibold text-gray-600";

export function Shell({
  children,
  title,
  subtitle,
  message,
  compactHeader = false,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  message?: string;
  compactHeader?: boolean;
}) {
  return (
    <main className="min-h-screen px-4 py-6 text-[var(--ink)] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header
          className={`mb-6 rounded-[2rem] border border-[var(--line)] bg-[var(--panel)] shadow-[0_24px_80px_rgba(18,58,104,0.08)] backdrop-blur ${
            compactHeader ? "px-6 py-5" : "px-6 py-8"
          }`}
        >
          <div className={`flex flex-wrap items-center gap-3 ${compactHeader ? "mb-0" : "mb-3"}`}>
            <p className="inline-flex rounded-full border border-[rgba(200,159,52,0.3)] bg-[rgba(200,159,52,0.16)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gold-deep)]">
              Barnes Bucks National Bank
            </p>
            {isPreviewMode ? (
              <p className="inline-flex rounded-full border border-[rgba(188,76,60,0.3)] bg-[rgba(188,76,60,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--red)]">
                Preview Mode
              </p>
            ) : null}
          </div>
          {!compactHeader ? <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1> : null}
          {!compactHeader ? <p className="mt-3 max-w-3xl text-base text-[var(--muted)] sm:text-lg">{subtitle}</p> : null}
          {isPreviewMode ? (
            <div className={`${compactHeader ? "mt-3" : "mt-5"} rounded-2xl border border-[rgba(188,76,60,0.24)] bg-[rgba(188,76,60,0.08)] px-4 py-3 text-sm font-medium text-[var(--red)]`}>
              You are using the safe preview database. Changes here do not affect your normal local app or your live Render site.
            </div>
          ) : null}
          {message ? (
            <div className={`${compactHeader ? "mt-3" : "mt-5"} rounded-2xl border border-[rgba(14,143,91,0.25)] bg-[rgba(14,143,91,0.1)] px-4 py-3 text-sm font-medium text-[var(--green)]`}>
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
    <Shell title={title} subtitle={subtitle} message={message} compactHeader>
      <div className="mb-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="relative overflow-hidden rounded-[2.1rem] border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(160deg,#0b2340_0%,#123a68_46%,#8a6510_158%)] p-6 text-white shadow-[0_30px_80px_rgba(10,28,52,0.28)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_34%),linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.04)_48%,transparent_100%)]" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/72">Barnes Bucks Bank</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/52">Admin Console</p>
              </div>
              <div className="mt-8 flex items-center gap-5">
                <div className="flex h-18 w-18 items-center justify-center rounded-full border border-white/18 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.24),rgba(255,255,255,0.08)_40%,transparent_72%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] text-base font-semibold tracking-[0.22em] text-white/92">
                    BK
                  </div>
                </div>
                <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(255,255,255,0.24),transparent)]" />
              </div>
              <h1 className="mt-8 max-w-md text-[2.8rem] font-semibold leading-[0.98] tracking-[-0.04em]">{title}</h1>
              <p className="mt-4 max-w-xl text-[15px] leading-8 text-white/76">{subtitle}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2.1rem] border border-[rgba(18,58,104,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(250,245,236,0.96))] p-3 shadow-[0_26px_70px_rgba(18,58,104,0.12)]">
          <div className="rounded-[1.65rem] border border-[rgba(18,58,104,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,252,246,0.88))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--gold-deep)]">Navigation</p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-[var(--ink)]">Administrative Workspaces</p>
              </div>
              <form action={logoutAction} className="lg:shrink-0">
                <button className={ghostButtonClass}>Sign Out</button>
              </form>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`rounded-[1.35rem] border px-4 py-4 transition ${
                    item.key === activeTab
                      ? "border-[rgba(18,58,104,0.2)] bg-[linear-gradient(180deg,#163f70,#0d2d52)] text-white shadow-[0_18px_36px_rgba(18,58,104,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]"
                      : "border-[rgba(18,58,104,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,243,235,0.9))] text-[var(--ink)] shadow-[0_10px_24px_rgba(18,58,104,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] hover:border-[rgba(18,58,104,0.2)]"
                  }`}
                >
                  <span className="block text-base font-semibold">{item.label}</span>
                  <span
                    className={`mt-2 block text-xs uppercase tracking-[0.2em] ${
                      item.key === activeTab ? "text-white/74" : "text-[var(--muted)]"
                    }`}
                  >
                    {item.detail}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
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
      className="rounded-[1.9rem] border border-[rgba(18,58,104,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,245,236,0.92))] p-3 shadow-[0_22px_60px_rgba(18,58,104,0.1)] backdrop-blur"
      style={accent ? { borderColor: accent } : undefined}
    >
      <div className="rounded-[1.45rem] border border-[rgba(18,58,104,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,252,246,0.88))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">{title}</h2>
        {children}
      </div>
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
    <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.55)] px-4 py-6 text-sm leading-7 text-[var(--muted)]">
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
    <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3 shadow-[0_10px_24px_rgba(18,58,104,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold tracking-tight">
            {titleCase(entry.type)}
            {entry.jobTitle ? ` - ${entry.jobTitle}` : ""}
            {entry.rewardTitle ? ` - ${entry.rewardTitle}` : ""}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {entry.fromName ? `From ${entry.fromName}` : ""}
            {entry.fromName && entry.toName ? " to " : ""}
            {entry.toName ? entry.toName : ""}
            {entry.actorName ? ` - Posted by ${entry.actorName}` : ""}
          </p>
          {entry.note ? <p className="mt-2 text-sm leading-7">{entry.note}</p> : null}
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-xl font-semibold ${tone}`}>
            {sign}
            {formatBucks(entry.amount)}
          </p>
          <p className="text-xs text-[var(--muted)]">{formatDate(entry.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
