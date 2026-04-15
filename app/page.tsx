import {
  adminLoginAction,
  adjustBalanceAction,
  claimJobAction,
  createJobAction,
  createKidAction,
  createRewardAction,
  createTransferAction,
  kidLoginAction,
  logoutAction,
  redeemRewardAction,
  resolveJobAction,
  resolveRewardAction,
  setupAdminAction,
  submitJobAction,
  toggleKidAction,
  toggleRewardAction,
  updateKidPinAction,
} from "@/app/actions";
import { getSession } from "@/lib/auth";
import {
  getActiveRewards,
  getAdmin,
  getAllRewards,
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
import { formatBucks, formatDate, titleCase } from "@/lib/format";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const isPreviewMode = Boolean(process.env.BARNES_BUCKS_DB_PATH);

const inputClass =
  "w-full rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-[15px] outline-none transition focus:border-[var(--navy)] focus:ring-2 focus:ring-[rgba(18,58,104,0.16)]";

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110";

const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:brightness-105";

const ghostButtonClass =
  "inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--navy)]";

const dangerButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[var(--red)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105";

const disabledButtonClass =
  "inline-flex items-center justify-center rounded-full bg-gray-300 px-5 py-3 text-sm font-semibold text-gray-600";

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
    return <LoginScreen admin={admin} kids={kids.filter((kid) => kid.active)} message={message} />;
  }

  if (session.role === "admin") {
    return (
      <AdminDashboard
        admin={session.user}
        kids={kids}
        jobs={getJobs()}
        rewards={getAllRewards()}
        redemptions={getRedemptions()}
        transactions={getRecentTransactions()}
        message={message}
      />
    );
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

function Shell({
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

function Card({
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

function Stat({
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.55)] px-4 py-6 text-sm text-[var(--muted)]">
      {text}
    </div>
  );
}

function SetupScreen({ message }: { message?: string }) {
  return (
    <Shell
      title="Open The Family Bank"
      subtitle="Set up the first super-admin account to launch Barnes Bucks. After this step, kids can sign in with profile picks and PINs."
      message={message}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card title="Create The Bank Admin" accent="rgba(18,58,104,0.25)">
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
        </Card>
        <Card title="What This App Handles">
          <div className="grid gap-4">
            <Stat label="Balances" value="Live Ledger" detail="Every deposit, deduction, transfer, job reward, and reward redemption is tracked." tone="gold" />
            <Stat label="Family Jobs" value="Post, Claim, Approve" detail="Parents and kids can post jobs, then the admin approves completed work." />
            <Stat label="Rewards" value="Digital Storefront" detail="Kids can request rewards with Barnes Bucks instead of trading paper money." tone="green" />
          </div>
        </Card>
      </div>
    </Shell>
  );
}

function LoginScreen({
  admin,
  kids,
  message,
}: {
  admin?: UserSummary;
  kids: UserSummary[];
  message?: string;
}) {
  return (
    <Shell
      title="Welcome Back To The Vault"
      subtitle="Kids pick their profile and enter a short PIN. The family banker signs in with the admin PIN."
      message={message}
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card title="Kid Login" accent="rgba(200,159,52,0.28)">
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
        </Card>
        <Card title="Admin Login" accent="rgba(18,58,104,0.28)">
          <form action={adminLoginAction} className="grid gap-4">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--muted)]">
              Signing in as <span className="font-semibold text-[var(--ink)]">{admin?.name ?? "Bank Admin"}</span>
            </div>
            <Field label="Admin PIN">
              <input name="pin" type="password" inputMode="numeric" pattern="\d{4,8}" className={inputClass} required />
            </Field>
            <button className={secondaryButtonClass}>Open Admin Console</button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}

function AdminDashboard({
  admin,
  kids,
  jobs,
  rewards,
  redemptions,
  transactions,
  message,
}: {
  admin: UserSummary;
  kids: UserSummary[];
  jobs: JobSummary[];
  rewards: RewardSummary[];
  redemptions: RedemptionSummary[];
  transactions: TransactionSummary[];
  message?: string;
}) {
  const activeKids = kids.filter((kid) => kid.active);
  const pendingJobs = jobs.filter((job) => job.status === "submitted");
  const pendingRewards = redemptions.filter((redemption) => redemption.status === "requested");
  const totalBucks = activeKids.reduce((sum, kid) => sum + kid.balance, 0);

  return (
    <Shell
      title={`Admin Console For ${admin.name}`}
      subtitle="Run the family bank, review jobs, move Barnes Bucks, and keep the reward catalog tidy from one place."
      message={message}
    >
      <form action={logoutAction} className="mb-6">
        <button className={ghostButtonClass}>Sign Out</button>
      </form>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active Accounts" value={String(activeKids.length)} detail="Kid accounts ready to use" />
        <Stat label="Total Circulation" value={formatBucks(totalBucks)} detail="Combined balance across active kid accounts" tone="gold" />
        <Stat label="Jobs Waiting" value={String(pendingJobs.length)} detail="Submitted jobs ready for review" />
        <Stat label="Reward Requests" value={String(pendingRewards.length)} detail="Rewards waiting for approval" tone="green" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-6">
          <Card title="Accounts">
            <div className="grid gap-4">
              {kids.map((kid) => (
                <div
                  key={kid.id}
                  className="grid gap-4 rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4 lg:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-full text-lg"
                        style={{ backgroundColor: kid.color, color: "white" }}
                      >
                        {kid.avatar}
                      </span>
                      <div>
                        <p className="text-lg font-semibold">{kid.name}</p>
                        <p className="text-sm text-[var(--muted)]">
                          {kid.active ? "Active account" : "Archived account"} - Balance {formatBucks(kid.balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <form action={adjustBalanceAction} className="grid gap-2 rounded-[1.25rem] border border-[var(--line)] bg-white px-3 py-3">
                    <input type="hidden" name="userId" value={kid.id} />
                    <select name="direction" className={inputClass} defaultValue="deposit">
                      <option value="deposit">Deposit</option>
                      <option value="deduct">Deduct</option>
                    </select>
                    <input name="amount" type="number" min="1" className={inputClass} placeholder="Amount" required />
                    <input name="note" className={inputClass} placeholder="Reason" required />
                    <button className={secondaryButtonClass}>Post</button>
                  </form>
                  <form action={updateKidPinAction} className="grid gap-2 rounded-[1.25rem] border border-[var(--line)] bg-white px-3 py-3">
                    <input type="hidden" name="userId" value={kid.id} />
                    <input name="pin" type="password" inputMode="numeric" pattern="\d{4,8}" className={inputClass} placeholder="New PIN" required />
                    <button className={ghostButtonClass}>Reset PIN</button>
                  </form>
                  <form action={toggleKidAction} className="flex items-center">
                    <input type="hidden" name="userId" value={kid.id} />
                    <input type="hidden" name="active" value={kid.active ? "false" : "true"} />
                    <button className={kid.active ? dangerButtonClass : primaryButtonClass}>
                      {kid.active ? "Archive" : "Restore"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Add Kid Account">
              <form action={createKidAction} className="grid gap-3">
                <input name="name" className={inputClass} placeholder="Name" required />
                <input name="pin" type="password" inputMode="numeric" pattern="\d{4,8}" className={inputClass} placeholder="PIN" required />
                <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                  <input name="color" type="color" className={`${inputClass} h-12`} defaultValue="#1d4ed8" />
                  <input name="avatar" className={inputClass} placeholder="Icon or initials" defaultValue="BB" required />
                </div>
                <button className={primaryButtonClass}>Create Account</button>
              </form>
            </Card>

            <Card title="Transfer Between Kids">
              <form action={createTransferAction} className="grid gap-3">
                <select name="fromUserId" className={inputClass} defaultValue="">
                  <option value="" disabled>
                    From account
                  </option>
                  {activeKids.map((kid) => (
                    <option key={kid.id} value={kid.id}>
                      {kid.name} - {formatBucks(kid.balance)}
                    </option>
                  ))}
                </select>
                <select name="toUserId" className={inputClass} defaultValue="">
                  <option value="" disabled>
                    To account
                  </option>
                  {activeKids.map((kid) => (
                    <option key={kid.id} value={kid.id}>
                      {kid.name}
                    </option>
                  ))}
                </select>
                <input name="amount" type="number" min="1" className={inputClass} placeholder="Amount" required />
                <input name="note" className={inputClass} placeholder="Reason" />
                <button className={secondaryButtonClass}>Send Barnes Bucks</button>
              </form>
            </Card>
          </div>

          <Card title="Approvals">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-3">
                <h3 className="text-lg font-semibold">Submitted Jobs</h3>
                {pendingJobs.length === 0 ? (
                  <EmptyState text="No jobs are waiting for review." />
                ) : (
                  pendingJobs.map((job) => (
                    <div key={job.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                      <p className="text-lg font-semibold">{job.title}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {job.claimantName} - {formatBucks(job.rewardAmount)}
                      </p>
                      {job.description ? <p className="mt-2 text-sm">{job.description}</p> : null}
                      {job.claimantNote ? <p className="mt-2 text-sm text-[var(--muted)]">Kid note: {job.claimantNote}</p> : null}
                      <div className="mt-3 flex gap-2">
                        <form action={resolveJobAction}>
                          <input type="hidden" name="jobId" value={job.id} />
                          <input type="hidden" name="decision" value="approve" />
                          <button className={primaryButtonClass}>Approve</button>
                        </form>
                        <form action={resolveJobAction}>
                          <input type="hidden" name="jobId" value={job.id} />
                          <input type="hidden" name="decision" value="reject" />
                          <button className={dangerButtonClass}>Reject</button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid gap-3">
                <h3 className="text-lg font-semibold">Reward Requests</h3>
                {pendingRewards.length === 0 ? (
                  <EmptyState text="No reward requests are waiting right now." />
                ) : (
                  pendingRewards.map((request) => (
                    <div key={request.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                      <p className="text-lg font-semibold">{request.rewardTitle}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {request.userName} - {formatBucks(request.rewardCost)}
                      </p>
                      {request.note ? <p className="mt-2 text-sm">{request.note}</p> : null}
                      <div className="mt-3 flex gap-2">
                        <form action={resolveRewardAction}>
                          <input type="hidden" name="redemptionId" value={request.id} />
                          <input type="hidden" name="decision" value="approve" />
                          <button className={primaryButtonClass}>Approve</button>
                        </form>
                        <form action={resolveRewardAction}>
                          <input type="hidden" name="redemptionId" value={request.id} />
                          <input type="hidden" name="decision" value="decline" />
                          <button className={dangerButtonClass}>Decline</button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card title="Post New Job">
            <form action={createJobAction} className="grid gap-3">
              <input name="title" className={inputClass} placeholder="Unload the dishwasher" required />
              <textarea name="description" className={`${inputClass} min-h-24`} placeholder="Optional details or expectations" />
              <input name="rewardAmount" type="number" min="1" className={inputClass} placeholder="Reward amount" required />
              <button className={primaryButtonClass}>Publish Job</button>
            </form>
          </Card>

          <Card title="Rewards Catalog">
            <form action={createRewardAction} className="grid gap-3">
              <input name="title" className={inputClass} placeholder="Pick Friday movie" required />
              <textarea name="description" className={`${inputClass} min-h-20`} placeholder="What the reward means" />
              <input name="cost" type="number" min="1" className={inputClass} placeholder="Cost in Barnes Bucks" required />
              <button className={secondaryButtonClass}>Add Reward</button>
            </form>

            <div className="mt-4 grid gap-3">
              {rewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3">
                  <div>
                    <p className="font-semibold">{reward.title}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {formatBucks(reward.cost)} - {reward.active ? "Available" : "Hidden"}
                    </p>
                  </div>
                  <form action={toggleRewardAction}>
                    <input type="hidden" name="rewardId" value={reward.id} />
                    <input type="hidden" name="active" value={reward.active ? "false" : "true"} />
                    <button className={reward.active ? ghostButtonClass : primaryButtonClass}>
                      {reward.active ? "Hide" : "Show"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Recent Ledger">
            <div className="grid gap-3">
              {transactions.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
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

  return (
    <Shell
      title={`${kid.avatar} ${kid.name}'s Account`}
      subtitle="Check your balance, send Barnes Bucks to a sibling, claim jobs, and request rewards from the family bank."
      message={message}
    >
      <form action={logoutAction} className="mb-6">
        <button className={ghostButtonClass}>Sign Out</button>
      </form>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Stat label="Available Balance" value={formatBucks(kid.balance)} detail="Spend, save, or send it" tone="gold" />
        <Stat label="Jobs In Progress" value={String(myClaimedJobs.length)} detail="Claimed or waiting for approval" />
        <Stat label="Reward Requests" value={String(pendingRequests.length)} detail="Requests pending approval" tone="green" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Send Barnes Bucks">
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
                <button className={secondaryButtonClass}>Send</button>
              </form>
            </Card>

            <Card title="Post A Job">
              <form action={createJobAction} className="grid gap-3">
                <input name="title" className={inputClass} placeholder="Organize board games" required />
                <textarea name="description" className={`${inputClass} min-h-24`} placeholder="Optional details" />
                <input name="rewardAmount" type="number" min="1" className={inputClass} placeholder="Reward amount" required />
                <button className={ghostButtonClass}>Post Job</button>
              </form>
            </Card>
          </div>

          <Card title="Available Jobs">
            <div className="grid gap-3">
              {openJobs.length === 0 ? (
                <EmptyState text="No open jobs right now. Check back later or post one." />
              ) : (
                openJobs.map((job) => (
                  <div key={job.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
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
                    {job.description ? <p className="mt-2 text-sm">{job.description}</p> : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Your Claimed Jobs">
            <div className="grid gap-3">
              {myClaimedJobs.length === 0 ? (
                <EmptyState text="You do not have any claimed jobs yet." />
              ) : (
                myClaimedJobs.map((job) => (
                  <div key={job.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
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
          <Card title="Rewards">
            <div className="grid gap-3">
              {rewards.map((reward) => (
                <div key={reward.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                  <p className="text-lg font-semibold">{reward.title}</p>
                  <p className="text-sm text-[var(--muted)]">{formatBucks(reward.cost)}</p>
                  {reward.description ? <p className="mt-2 text-sm">{reward.description}</p> : null}
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

          <Card title="Your Reward Requests">
            <div className="grid gap-3">
              {redemptions.length === 0 ? (
                <EmptyState text="You have not requested any rewards yet." />
              ) : (
                redemptions.map((request) => (
                  <div key={request.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                    <p className="font-semibold">{request.rewardTitle}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {titleCase(request.status)} - {formatBucks(request.rewardCost)}
                    </p>
                    {request.note ? <p className="mt-2 text-sm">{request.note}</p> : null}
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

function LedgerRow({
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
