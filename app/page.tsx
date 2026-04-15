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
    return <LoginScreen admin={admin} kids={kids.filter((kid) => kid.active)} message={message} />;
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

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-[1.9rem] border border-[rgba(18,58,104,0.14)] bg-[linear-gradient(140deg,rgba(18,58,104,0.12),rgba(255,255,255,0.86)_55%,rgba(200,159,52,0.12))] p-6 shadow-[0_24px_80px_rgba(18,58,104,0.1)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Account Home</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-[var(--navy)] text-3xl font-semibold text-white shadow-[0_16px_34px_rgba(18,58,104,0.22)]">
                  {kid.avatar}
                </div>
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{kid.name}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                    This is your account home. Check your Barnes Bucks, pick your next job, and cash in rewards when you are ready.
                  </p>
                </div>
              </div>
            </div>
            <div className="min-w-[220px] rounded-[1.6rem] border border-[rgba(18,58,104,0.14)] bg-white/85 px-5 py-4 shadow-[0_14px_36px_rgba(18,58,104,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Available Balance</p>
              <p className="mt-3 text-4xl font-semibold text-[var(--navy)]">{formatBucks(kid.balance)}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Ready to spend, save, send, or use on rewards.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <Stat label="Jobs In Progress" value={String(myClaimedJobs.length)} detail="Claimed or waiting for approval" />
          <Stat label="Reward Requests" value={String(pendingRequests.length)} detail="Requests pending approval" tone="green" />
          <Stat label="Rewards You Can Afford" value={String(availableRewards)} detail="Ready to request right now" tone="gold" />
        </div>
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
