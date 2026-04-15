import {
  createJobAction,
  resolveJobAction,
  resolveRewardAction,
} from "@/app/actions";
import {
  AdminShell,
  Card,
  EmptyState,
  dangerButtonClass,
  inputClass,
  primaryButtonClass,
} from "@/app/components";
import { getJobs, getRedemptions, initializeDatabase } from "@/lib/data";
import { requireAdminSession } from "@/lib/guards";
import { formatBucks, titleCase } from "@/lib/format";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminJobsPage({ searchParams }: PageProps) {
  initializeDatabase();
  await requireAdminSession();
  const jobs = getJobs();
  const redemptions = getRedemptions();
  const openJobs = jobs.filter((job) => job.status === "open" || job.status === "claimed");
  const submittedJobs = jobs.filter((job) => job.status === "submitted");
  const reviewedJobs = jobs.filter((job) => job.status === "approved" || job.status === "rejected");
  const pendingRewards = redemptions.filter((request) => request.status === "requested");
  const reviewedRewards = redemptions.filter((request) => request.status !== "requested");
  const params = (await searchParams) ?? {};
  const messageValue = params.message;
  const message = Array.isArray(messageValue) ? messageValue[0] : messageValue;

  return (
    <AdminShell
      activeTab="jobs"
      title="Jobs And Approvals"
      subtitle="Post work, review submissions, and keep job and reward approvals moving."
      message={message}
    >
      <div className="mb-6">
        <Card title="Today&apos;s Queue">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <p className="text-sm text-[var(--muted)]">Jobs waiting</p>
              <p className="mt-2 text-3xl font-semibold">{submittedJobs.length}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <p className="text-sm text-[var(--muted)]">Reward requests</p>
              <p className="mt-2 text-3xl font-semibold">{pendingRewards.length}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <p className="text-sm text-[var(--muted)]">Open or claimed jobs</p>
              <p className="mt-2 text-3xl font-semibold">{openJobs.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-6">
          <Card title="Post New Job">
            <form action={createJobAction} className="grid gap-3">
              <input name="title" className={inputClass} placeholder="Unload the dishwasher" required />
              <textarea name="description" className={`${inputClass} min-h-28`} placeholder="Optional details or expectations" />
              <input name="rewardAmount" type="number" min="1" className={inputClass} placeholder="Reward amount" required />
              <button className={primaryButtonClass}>Publish Job</button>
            </form>
          </Card>

          <Card title="Submitted Jobs">
            <div className="grid gap-3">
              {submittedJobs.length === 0 ? (
                <EmptyState text="No submitted jobs are waiting for approval." />
              ) : (
                submittedJobs.map((job) => (
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
          </Card>

          <Card title="Reward Requests">
            <div className="grid gap-3">
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
          </Card>
        </div>

        <div className="grid gap-6">
          <Card title="Open And In-Progress Jobs">
            <div className="grid gap-3">
              {openJobs.length === 0 ? (
                <EmptyState text="No open or claimed jobs at the moment." />
              ) : (
                openJobs.map((job) => (
                  <div key={job.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{job.title}</p>
                        <p className="text-sm text-[var(--muted)]">
                          {titleCase(job.status)} - {formatBucks(job.rewardAmount)}
                        </p>
                      </div>
                      <p className="text-sm text-[var(--muted)]">
                        {job.claimantName ? `Claimed by ${job.claimantName}` : `Posted by ${job.creatorName}`}
                      </p>
                    </div>
                    {job.description ? <p className="mt-2 text-sm">{job.description}</p> : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Recently Reviewed Jobs">
            <div className="grid gap-3">
              {reviewedJobs.length === 0 ? (
                <EmptyState text="No reviewed jobs yet." />
              ) : (
                reviewedJobs.slice(0, 8).map((job) => (
                  <div key={job.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                    <p className="font-semibold">{job.title}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {titleCase(job.status)} - {job.claimantName ?? "Unclaimed"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Recently Reviewed Reward Requests">
            <div className="grid gap-3">
              {reviewedRewards.length === 0 ? (
                <EmptyState text="No reviewed reward requests yet." />
              ) : (
                reviewedRewards.slice(0, 8).map((request) => (
                  <div key={request.id} className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
                    <p className="font-semibold">{request.rewardTitle}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {titleCase(request.status)} - {request.userName}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
