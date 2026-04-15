import {
  adjustBalanceAction,
  createTransferAction,
  resolveJobAction,
  resolveRewardAction,
} from "@/app/actions";
import {
  AdminShell,
  Card,
  EmptyState,
  LedgerRow,
  Stat,
  dangerButtonClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/app/components";
import { getJobs, getKids, getRecentTransactions, getRedemptions, initializeDatabase } from "@/lib/data";
import { requireAdminSession } from "@/lib/guards";
import { formatBucks } from "@/lib/format";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  initializeDatabase();
  await requireAdminSession();
  const kids = getKids(false);
  const jobs = getJobs();
  const redemptions = getRedemptions();
  const transactions = getRecentTransactions();
  const activeKids = kids.filter((kid) => kid.active);
  const pendingJobs = jobs.filter((job) => job.status === "submitted");
  const pendingRewards = redemptions.filter((redemption) => redemption.status === "requested");
  const totalBucks = activeKids.reduce((sum, kid) => sum + kid.balance, 0);
  const params = (await searchParams) ?? {};
  const messageValue = params.message;
  const message = Array.isArray(messageValue) ? messageValue[0] : messageValue;

  return (
    <AdminShell
      activeTab="dashboard"
      title="Admin Dashboard"
      subtitle="Handle the daily banking work: balances, quick adjustments, approvals, and recent activity."
      message={message}
    >
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active Accounts" value={String(activeKids.length)} detail="Kid accounts ready to use" />
        <Stat label="Total Circulation" value={formatBucks(totalBucks)} detail="Combined balance across active kid accounts" tone="gold" />
        <Stat label="Jobs Waiting" value={String(pendingJobs.length)} detail="Submitted jobs ready for review" />
        <Stat label="Reward Requests" value={String(pendingRewards.length)} detail="Rewards waiting for approval" tone="green" />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card title="Daily Actions">
          <div className="grid gap-4 lg:grid-cols-2">
            <form action={createTransferAction} className="grid gap-3 rounded-[1.4rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Quick Transfer
                </p>
              </div>
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
              <button className={primaryButtonClass}>Send Barnes Bucks</button>
            </form>

            <div className="grid gap-3 rounded-[1.4rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Approval Snapshot
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] bg-[linear-gradient(145deg,rgba(18,58,104,0.08),rgba(255,255,255,0.88))] p-4">
                  <p className="text-sm text-[var(--muted)]">Jobs waiting</p>
                  <p className="mt-2 text-3xl font-semibold">{pendingJobs.length}</p>
                </div>
                <div className="rounded-[1.2rem] bg-[linear-gradient(145deg,rgba(14,143,91,0.12),rgba(255,255,255,0.88))] p-4">
                  <p className="text-sm text-[var(--muted)]">Rewards waiting</p>
                  <p className="mt-2 text-3xl font-semibold">{pendingRewards.length}</p>
                </div>
              </div>
              <p className="text-sm text-[var(--muted)]">
                Use the Jobs page when you want the full queue and posting tools.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-6">
          <Card title="Kid Balances">
            <div className="grid gap-4 md:grid-cols-2">
              {activeKids.map((kid) => (
                <div key={kid.id} className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-[1rem] text-lg font-semibold text-white"
                      style={{ backgroundColor: kid.color }}
                    >
                      {kid.avatar}
                    </span>
                    <div>
                      <p className="font-semibold">{kid.name}</p>
                      <p className="text-sm text-[var(--muted)]">{formatBucks(kid.balance)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Quick Balance Changes">
            <div className="grid gap-4 md:grid-cols-2">
              {activeKids.map((kid) => (
                <form key={kid.id} action={adjustBalanceAction} className="grid gap-3 rounded-[1.4rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                  <input type="hidden" name="userId" value={kid.id} />
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{kid.name}</p>
                      <p className="text-sm text-[var(--muted)]">{formatBucks(kid.balance)}</p>
                    </div>
                    <select name="direction" className={inputClass} defaultValue="deposit">
                      <option value="deposit">Deposit</option>
                      <option value="deduct">Deduct</option>
                    </select>
                  </div>
                  <input name="amount" type="number" min="1" className={inputClass} placeholder="Amount" required />
                  <input name="note" className={inputClass} placeholder="Reason" required />
                  <button className={secondaryButtonClass}>Post Change</button>
                </form>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card title="Pending Approvals">
            <div className="grid gap-4">
              <div className="grid gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Jobs</p>
                {pendingJobs.length === 0 ? (
                  <EmptyState text="No jobs are waiting for review." />
                ) : (
                  pendingJobs.slice(0, 4).map((job) => (
                    <div key={job.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {job.claimantName} - {formatBucks(job.rewardAmount)}
                      </p>
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
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Rewards</p>
                {pendingRewards.length === 0 ? (
                  <EmptyState text="No reward requests are waiting right now." />
                ) : (
                  pendingRewards.slice(0, 4).map((request) => (
                    <div key={request.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                      <p className="font-semibold">{request.rewardTitle}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {request.userName} - {formatBucks(request.rewardCost)}
                      </p>
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

          <Card title="Recent Activity">
            <div className="grid gap-3">
              {transactions.slice(0, 10).map((entry) => (
                <LedgerRow key={entry.id} entry={entry} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
