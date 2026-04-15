import { redirect } from "next/navigation";
import {
  claimJobAction,
  createJobAction,
  createTransferAction,
  kidLoginAction,
  logoutAction,
  redeemRewardAction,
  setupAdminAction,
  submitJobAction,
  adminLoginAction,
} from "@/app/actions";
import {
  Card,
  EmptyState,
  Field,
  LedgerRow,
  Shell,
  Stat,
  disabledButtonClass,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/app/components";
import { getSession } from "@/lib/auth";
import {
  getActiveRewards,
  getAdmin,
  getJobs,
  getKids,
  getRecentTransactions,
  getRecentTransactionsForUser,
  getRedemptions,
  hasAdmin,
  initializeDatabase,
  type JobSummary,
  type RedemptionSummary,
  type RewardSummary,
  type TransactionSummary,
  type UserSummary,
} from "@/lib/data";
import { formatBucks, titleCase } from "@/lib/format";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: PageProps) {
  initializeDatabase();
  const session = await getSession();
  const params = (await searchParams) ?? {};
  const messageValue = params.message;
  const message = Array.isArray(messageValue) ? messageValue[0] : messageValue;

  if (!hasAdmin()) {
    return <SetupScreen message={message} />;
  }

  const admin = getAdmin();
  const kids = getKids(false);

  if (!session) {
    return (
      <LoginScreen
        admin={admin}
        kids={kids.filter((kid) => kid.active)}
        jobs={getJobs()}
        transactions={getRecentTransactions(100)}
        message={message}
      />
    );
  }

  if (session.role === "admin") {
    redirect("/admin/dashboard");
  }

  return (
    <KidDashboard
      kid={session.user}
      kids={kids.filter((entry) => entry.active)}
      jobs={getJobs()}
      rewards={getActiveRewards()}
      redemptions={getRedemptions().filter((item) => item.userId === session.userId)}
      transactions={getRecentTransactionsForUser(session.userId)}
      message={message}
    />
  );
}

function SetupScreen({ message }: { message?: string }) {
  return (
    <Shell
      title="Open The Family Bank"
      subtitle="Set up the first super-admin account to launch Barnes Bucks. After this step, kids can sign in with profile picks and PINs."
      message={message}
      compactHeader
    >
      <div className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(160deg,#0b2340_0%,#123a68_46%,#8a6510_155%)] p-7 text-white shadow-[0_34px_90px_rgba(10,28,52,0.3)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_34%),linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.04)_48%,transparent_100%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/72">Founding Account</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/52">Est. 2026</p>
              </div>
              <div className="mt-8 flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/18 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.24),rgba(255,255,255,0.08)_40%,transparent_72%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] text-lg font-semibold tracking-[0.22em] text-white/92">
                    BB
                  </div>
                </div>
                <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(255,255,255,0.24),transparent)]" />
              </div>
              <h2 className="mt-8 max-w-sm text-[2.95rem] font-semibold leading-[0.98] tracking-[-0.04em]">Establish the family vault.</h2>
              <p className="mt-4 max-w-md text-[15px] leading-8 text-white/76">
                Open the banker account once, then run Barnes Bucks with the calm confidence of a real private bank.
              </p>
            </div>

            <div className="grid gap-0 overflow-hidden rounded-[1.6rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/58">Ledger Precision</p>
                <p className="mt-2 text-sm leading-7 text-white/88">Balances, jobs, transfers, and rewards land in one disciplined record.</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/58">Family Access</p>
                <p className="mt-2 text-sm leading-7 text-white/88">Kids use profiles and PINs while the banker controls the full institution.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-[rgba(18,58,104,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(250,245,236,0.96))] p-3 shadow-[0_30px_80px_rgba(18,58,104,0.12)]">
          <div className="rounded-[1.7rem] border border-[rgba(18,58,104,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,252,246,0.88))] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--gold-deep)]">Administrator Setup</p>
                <h2 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.03em] text-[var(--ink)]">Create The Bank Admin</h2>
              </div>
              <div className="rounded-full border border-[rgba(18,58,104,0.1)] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                Step 1
              </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-[1.3rem] border border-[rgba(18,58,104,0.08)] bg-white/88 px-4 py-4 text-sm leading-7 text-[var(--muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                Create the family banker account first. After that, you can add kid profiles and begin issuing Barnes Bucks.
              </div>
              <div className="rounded-[1.3rem] border border-[rgba(200,159,52,0.14)] bg-[linear-gradient(180deg,rgba(200,159,52,0.12),rgba(255,255,255,0.72))] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--gold-deep)]">Role</p>
                <p className="mt-2 text-base font-semibold text-[var(--ink)]">Primary banker</p>
                <p className="mt-1 text-sm leading-7 text-[var(--muted)]">Full control over balances, jobs, approvals, and rewards.</p>
              </div>
            </div>

            <form action={setupAdminAction} className="grid gap-4">
              <Field label="Admin name">
                <input name="name" placeholder="Jim" className={inputClass} required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="PIN">
                  <input name="pin" type="password" inputMode="numeric" pattern="\d{4,8}" className={inputClass} required />
                </Field>
                <Field label="Confirm PIN">
                  <input
                    name="confirmPin"
                    type="password"
                    inputMode="numeric"
                    pattern="\d{4,8}"
                    className={inputClass}
                    required
                  />
                </Field>
              </div>
              <button className={primaryButtonClass}>Launch Barnes Bucks Bank</button>
            </form>
          </div>
        </section>
      </div>
    </Shell>
  );
}

function LoginScreen({
  admin,
  kids,
  jobs,
  transactions,
  message,
}: {
  admin?: UserSummary;
  kids: UserSummary[];
  jobs: JobSummary[];
  transactions: TransactionSummary[];
  message?: string;
}) {
  const openJobsCount = jobs.filter((job) => job.status === "open").length;
  const topEarner = getTopEarnerOfWeek(kids, transactions);

  return (
    <Shell
      title="Welcome Back To The Vault"
      subtitle="Kids pick their profile and enter a short PIN. The family banker signs in with the admin PIN."
      message={message}
      compactHeader
    >
      <div className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="relative overflow-hidden rounded-[2.2rem] border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(160deg,#0b2340_0%,#123a68_48%,#8a6510_160%)] p-7 text-white shadow-[0_34px_90px_rgba(10,28,52,0.3)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_34%),linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.04)_48%,transparent_100%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/72">Private Family Banking</p>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/52">Secure Access</p>
              </div>
              <div className="mt-8 flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/18 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.24),rgba(255,255,255,0.08)_40%,transparent_72%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] text-lg font-semibold tracking-[0.22em] text-white/92">
                    BB
                  </div>
                </div>
                <div className="h-px flex-1 bg-[linear-gradient(90deg,rgba(255,255,255,0.24),transparent)]" />
              </div>
              <h2 className="mt-8 max-w-sm text-[2.95rem] font-semibold leading-[0.98] tracking-[-0.04em]">Your Barnes Bucks vault is ready.</h2>
              <p className="mt-4 max-w-md text-[15px] leading-8 text-white/76">
                A private banking entrance for the family institution.
              </p>
            </div>

            <div className="grid gap-0 overflow-hidden rounded-[1.6rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/58">Jobs Available</p>
                <p className="mt-2 text-[2rem] font-semibold leading-none">{openJobsCount}</p>
                <p className="mt-2 text-sm text-white/76">Open jobs ready to be claimed.</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/58">Top Earner This Week</p>
                <p className="mt-2 text-xl font-semibold">{topEarner.name}</p>
                <p className="mt-2 text-sm text-white/76">{topEarner.detail}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-[rgba(18,58,104,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(250,245,236,0.96))] p-3 shadow-[0_30px_80px_rgba(18,58,104,0.12)]">
          <div className="rounded-[1.7rem] border border-[rgba(18,58,104,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,252,246,0.88))] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--gold-deep)]">Account Access</p>
                <h2 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.03em] text-[var(--ink)]">Sign In</h2>
              </div>
              <div className="rounded-full border border-[rgba(18,58,104,0.1)] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                Secure PIN
              </div>
            </div>

            <div className="rounded-[1.45rem] border border-[rgba(18,58,104,0.08)] bg-[linear-gradient(90deg,rgba(18,58,104,0.08),rgba(200,159,52,0.08))] p-px">
              <div className="grid grid-cols-2 gap-2 rounded-[1.38rem] bg-[linear-gradient(180deg,rgba(245,239,229,0.95),rgba(255,255,255,0.9))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                <input type="radio" name="login-mode" id="kid-login-mode" className="peer/kid sr-only" defaultChecked />
                <input type="radio" name="login-mode" id="admin-login-mode" className="peer/admin sr-only" />

            <label
              htmlFor="kid-login-mode"
              className="col-start-1 row-start-1 cursor-pointer rounded-full border border-transparent px-4 py-3 text-center text-sm font-semibold text-[var(--ink)] transition peer-checked/kid:border-[rgba(18,58,104,0.18)] peer-checked/kid:bg-[var(--navy)] peer-checked/kid:text-white peer-checked/kid:shadow-[0_14px_30px_rgba(18,58,104,0.18)]"
            >
              Kid Access
            </label>
            <label
              htmlFor="admin-login-mode"
              className="col-start-2 row-start-1 cursor-pointer rounded-full border border-transparent px-4 py-3 text-center text-sm font-semibold text-[var(--ink)] transition peer-checked/admin:border-[rgba(200,159,52,0.18)] peer-checked/admin:bg-[var(--gold)] peer-checked/admin:text-[var(--ink)] peer-checked/admin:shadow-[0_14px_30px_rgba(200,159,52,0.2)]"
            >
              Admin Access
            </label>

                <div className="col-span-2 hidden border-t border-[rgba(18,58,104,0.08)] pt-5 peer-checked/kid:block">
                  <form action={kidLoginAction} className="grid gap-4">
                <Field label="Choose your profile">
                  <select name="userId" className={inputClass} required defaultValue="">
                    <option value="" disabled>
                      Pick your name
                    </option>
                    {kids.map((kid) => (
                      <option key={kid.id} value={kid.id}>
                        {kid.avatar} {kid.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="PIN">
                  <input name="pin" type="password" inputMode="numeric" pattern="\d{4,8}" className={inputClass} required />
                </Field>
                <button className={primaryButtonClass}>Open Kid Dashboard</button>
                  </form>
                </div>

                <div className="col-span-2 hidden border-t border-[rgba(18,58,104,0.08)] pt-5 peer-checked/admin:block">
                  <p className="mb-5 text-sm text-[var(--muted)]">
                    Signing in as <span className="font-semibold text-[var(--ink)]">{admin?.name ?? "Bank Admin"}</span>
                  </p>
                  <form action={adminLoginAction} className="grid gap-4">
                <Field label="Admin PIN">
                  <input name="pin" type="password" inputMode="numeric" pattern="\d{4,8}" className={inputClass} required />
                </Field>
                <button className={secondaryButtonClass}>Open Admin Console</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Shell>
  );
}

function getTopEarnerOfWeek(kids: UserSummary[], transactions: TransactionSummary[]) {
  const startOfWeek = new Date();
  const day = startOfWeek.getDay();
  const diffToMonday = (day + 6) % 7;
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

  const earnings = new Map<number, number>();

  for (const transaction of transactions) {
    if (!transaction.toUserId) {
      continue;
    }

    const createdAt = new Date(transaction.createdAt);
    if (Number.isNaN(createdAt.getTime()) || createdAt < startOfWeek) {
      continue;
    }

    earnings.set(transaction.toUserId, (earnings.get(transaction.toUserId) ?? 0) + transaction.amount);
  }

  let topKid: UserSummary | undefined;
  let topAmount = 0;

  for (const kid of kids) {
    const amount = earnings.get(kid.id) ?? 0;
    if (amount > topAmount) {
      topKid = kid;
      topAmount = amount;
    }
  }

  if (!topKid || topAmount === 0) {
    return {
      name: "No leader yet",
      detail: "No Barnes Bucks have been earned this week yet.",
    };
  }

  return {
    name: topKid.name,
    detail: `${formatBucks(topAmount)} earned this week.`,
  };
}

function KidDashboard({
  kid,
  kids,
  jobs,
  rewards,
  redemptions,
  transactions,
  message,
}: {
  kid: UserSummary;
  kids: UserSummary[];
  jobs: JobSummary[];
  rewards: RewardSummary[];
  redemptions: RedemptionSummary[];
  transactions: TransactionSummary[];
  message?: string;
}) {
  const openJobs = jobs.filter((job) => job.status === "open");
  const myClaimedJobs = jobs.filter(
    (job) => job.claimedByUserId === kid.id && (job.status === "claimed" || job.status === "submitted"),
  );
  const siblingOptions = kids.filter((entry) => entry.id !== kid.id);
  const pendingRequests = redemptions.filter((item) => item.status === "requested");
  const availableRewards = rewards.filter((reward) => kid.balance >= reward.cost).length;

  return (
    <Shell
      title={`${kid.avatar} ${kid.name}'s Account`}
      subtitle="Check your balance, send Barnes Bucks to a sibling, claim jobs, and request rewards from the family bank."
      message={message}
    >
      <form action={logoutAction} className="mb-6">
        <button className={ghostButtonClass}>Sign Out</button>
      </form>

      <div className="mb-8 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(160deg,#0b2340_0%,#123a68_48%,#8a6510_162%)] p-6 text-white shadow-[0_28px_70px_rgba(10,28,52,0.26)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_34%),linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.04)_48%,transparent_100%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/72">Account Home</p>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.8rem] border border-white/14 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.22),rgba(255,255,255,0.08)_40%,transparent_72%)] text-3xl font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                  {kid.avatar}
                </div>
                <div>
                  <h2 className="text-[2.8rem] font-semibold leading-[0.98] tracking-[-0.04em]">{kid.name}</h2>
                  <p className="mt-3 max-w-xl text-[15px] leading-8 text-white/76">
                    Step into your Barnes Bucks vault, review your balance, and decide what to earn, save, send, or redeem next.
                  </p>
                </div>
              </div>
            </div>
            <div className="min-w-[240px] rounded-[1.6rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">Available Balance</p>
              <p className="mt-3 text-4xl font-semibold text-white">{formatBucks(kid.balance)}</p>
              <p className="mt-2 text-sm text-white/74">Ready to spend, save, send, or use on rewards.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <Stat label="Jobs In Progress" value={String(myClaimedJobs.length)} detail="Claimed or waiting for approval" />
          <Stat label="Reward Requests" value={String(pendingRequests.length)} detail="Requests pending approval" tone="green" />
          <Stat label="Rewards You Can Afford" value={String(availableRewards)} detail="Ready to request right now" tone="gold" />
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-6">
          <Card title="Quick Actions" accent="rgba(18,58,104,0.2)">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[1.35rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4 shadow-[0_10px_24px_rgba(18,58,104,0.05)]">
                <div className="mb-4">
                  <p className="text-lg font-semibold tracking-tight">Send Barnes Bucks</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Move some of your balance to a sibling.</p>
                </div>
                <form action={createTransferAction} className="grid gap-3">
                  <select name="toUserId" className={inputClass} defaultValue="">
                    <option value="" disabled>
                      Choose a sibling
                    </option>
                    {siblingOptions.map((sibling) => (
                      <option key={sibling.id} value={sibling.id}>
                        {sibling.name}
                      </option>
                    ))}
                  </select>
                  <input name="amount" type="number" min="1" className={inputClass} placeholder="Amount" required />
                  <input name="note" className={inputClass} placeholder="Why are you sending it?" />
                  <button className={secondaryButtonClass}>Send Transfer</button>
                </form>
              </div>

              <div className="rounded-[1.35rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4 shadow-[0_10px_24px_rgba(18,58,104,0.05)]">
                <div className="mb-4">
                  <p className="text-lg font-semibold tracking-tight">Post A Job</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">Offer a chore or helpful task for someone else to claim.</p>
                </div>
                <form action={createJobAction} className="grid gap-3">
                  <input name="title" className={inputClass} placeholder="Organize board games" required />
                  <textarea name="description" className={`${inputClass} min-h-24`} placeholder="Optional details" />
                  <input name="rewardAmount" type="number" min="1" className={inputClass} placeholder="Reward amount" required />
                  <button className={ghostButtonClass}>Post Job</button>
                </form>
              </div>
            </div>
          </Card>

          <Card title={`Jobs You Can Claim (${openJobs.length})`}>
            <div className="grid gap-3">
              {openJobs.length === 0 ? (
                <EmptyState text="No open jobs right now. Check back later or post one." />
              ) : (
                openJobs.map((job) => (
                  <div key={job.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4 shadow-[0_10px_24px_rgba(18,58,104,0.05)]">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold">{job.title}</p>
                        <p className="text-sm text-[var(--muted)]">
                          Posted by {job.creatorName} - {formatBucks(job.rewardAmount)}
                        </p>
                      </div>
                      <form action={claimJobAction}>
                        <input type="hidden" name="jobId" value={job.id} />
                        <button className={primaryButtonClass}>Claim Job</button>
                      </form>
                    </div>
                    {job.description ? <p className="mt-2 text-sm leading-7">{job.description}</p> : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title={`Your Claimed Jobs (${myClaimedJobs.length})`}>
            <div className="grid gap-3">
              {myClaimedJobs.length === 0 ? (
                <EmptyState text="You do not have any claimed jobs yet." />
              ) : (
                myClaimedJobs.map((job) => (
                  <div key={job.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4 shadow-[0_10px_24px_rgba(18,58,104,0.05)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-lg font-semibold">{job.title}</p>
                        <p className="text-sm text-[var(--muted)]">
                          Status: {titleCase(job.status)} - Reward {formatBucks(job.rewardAmount)}
                        </p>
                      </div>
                    </div>
                    {job.status === "claimed" ? (
                      <form action={submitJobAction} className="mt-3 grid gap-3">
                        <input type="hidden" name="jobId" value={job.id} />
                        <input name="note" className={inputClass} placeholder="Optional note for the banker" />
                        <button className={secondaryButtonClass}>Mark Ready For Approval</button>
                      </form>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--muted)]">Waiting for an admin to review your finished work.</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card title={`Rewards Store (${rewards.length})`} accent="rgba(200,159,52,0.28)">
            <div className="mb-4 rounded-[1.25rem] border border-[rgba(200,159,52,0.2)] bg-[rgba(200,159,52,0.12)] px-4 py-3 text-sm text-[var(--ink)]">
              You can afford <span className="font-semibold">{availableRewards}</span> reward{availableRewards === 1 ? "" : "s"} right now.
            </div>
            <div className="grid gap-3">
              {rewards.map((reward) => (
                <div key={reward.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4 shadow-[0_10px_24px_rgba(18,58,104,0.05)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold tracking-tight">{reward.title}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">Reward cost</p>
                    </div>
                    <p className="text-xl font-semibold text-[var(--gold-deep)]">{formatBucks(reward.cost)}</p>
                  </div>
                  {reward.description ? <p className="mt-2 text-sm leading-7">{reward.description}</p> : null}
                  <form action={redeemRewardAction} className="mt-3 grid gap-3">
                    <input type="hidden" name="rewardId" value={reward.id} />
                    <input type="hidden" name="cost" value={reward.cost} />
                    <input name="note" className={inputClass} placeholder="Optional note" />
                    <button className={kid.balance >= reward.cost ? primaryButtonClass : disabledButtonClass} disabled={kid.balance < reward.cost}>
                      {kid.balance >= reward.cost ? "Request Reward" : "Need More Barnes Bucks"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </Card>

          <Card title={`Your Reward Requests (${redemptions.length})`}>
            <div className="grid gap-3">
              {redemptions.length === 0 ? (
                <EmptyState text="You have not requested any rewards yet." />
              ) : (
                redemptions.map((request) => (
                  <div key={request.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4 shadow-[0_10px_24px_rgba(18,58,104,0.05)]">
                    <p className="font-semibold tracking-tight">{request.rewardTitle}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {titleCase(request.status)} - {formatBucks(request.rewardCost)}
                    </p>
                    {request.note ? <p className="mt-2 text-sm leading-7">{request.note}</p> : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Recent Activity">
            <div className="grid gap-3">
              {transactions.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} userId={kid.id} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
