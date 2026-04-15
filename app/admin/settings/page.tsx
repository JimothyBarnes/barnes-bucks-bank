import {
  createKidAction,
  createRewardAction,
  toggleKidAction,
  toggleRewardAction,
  updateKidPinAction,
} from "@/app/actions";
import {
  AdminShell,
  Card,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
  dangerButtonClass,
} from "@/app/components";
import { getAllRewards, getKids, initializeDatabase } from "@/lib/data";
import { requireAdminSession } from "@/lib/guards";
import { formatBucks } from "@/lib/format";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  initializeDatabase();
  await requireAdminSession();
  const kids = getKids(false);
  const rewards = getAllRewards();
  const params = (await searchParams) ?? {};
  const messageValue = params.message;
  const message = Array.isArray(messageValue) ? messageValue[0] : messageValue;

  return (
    <AdminShell
      activeTab="settings"
      title="Settings"
      subtitle="Manage kid accounts, PINs, account status, and the family rewards catalog."
      message={message}
    >
      <div className="mb-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.14)] bg-[linear-gradient(160deg,#0b2340_0%,#123a68_48%,#8a6510_162%)] p-6 text-white shadow-[0_28px_70px_rgba(10,28,52,0.26)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_34%),linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.04)_48%,transparent_100%)]" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/72">Institution Setup</p>
            <h2 className="mt-5 max-w-xl text-[2.55rem] font-semibold leading-[0.98] tracking-[-0.04em]">
              Keep the family bank orderly behind the scenes.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-8 text-white/76">
              Add new members, adjust access, reset PINs, and manage the rewards catalog with the same premium controls.
            </p>
          </div>
        </section>

        <Card title="Administrative Tasks">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Kid Accounts
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Add new kid accounts, reset PINs, and archive or restore access when needed.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Rewards Catalog
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Keep the reward list current, hide old items, and add new family incentives.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Create Kid Account">
          <form action={createKidAction} className="grid gap-3">
            <input name="name" className={inputClass} placeholder="Name" required />
            <input name="pin" type="password" inputMode="numeric" pattern="\d{4,8}" className={inputClass} placeholder="PIN" required />
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <input name="color" type="color" className={`${inputClass} h-12`} defaultValue="#1d4ed8" />
              <input name="avatar" className={inputClass} placeholder="Icon or initials" defaultValue="BB" required />
            </div>
            <button className={primaryButtonClass}>Create Account</button>
          </form>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card title="Accounts">
          <div className="grid gap-4">
            {kids.map((kid) => (
              <div
                key={kid.id}
                className="grid gap-5 rounded-[1.5rem] border border-[var(--line)] bg-[var(--panel-strong)] p-5 xl:grid-cols-[minmax(240px,0.82fr)_minmax(0,1.18fr)]"
              >
                <div className="rounded-[1.25rem] bg-[linear-gradient(145deg,rgba(18,58,104,0.06),rgba(255,255,255,0.9))] p-4">
                  <div className="flex items-center gap-4">
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] text-xl font-semibold text-white shadow-[inset_0_-8px_18px_rgba(0,0,0,0.08)]"
                      style={{ backgroundColor: kid.color }}
                    >
                      {kid.avatar}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xl font-semibold leading-none">{kid.name}</p>
                      <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                        {kid.active ? "Active Account" : "Archived Account"}
                      </p>
                      <p className="mt-4 text-sm text-[var(--muted)]">Current Balance</p>
                      <p className="text-2xl font-semibold text-[var(--navy)]">{formatBucks(kid.balance)}</p>
                      <p className="mt-3 max-w-sm text-sm leading-7 text-[var(--muted)]">
                        Use this page for lower-frequency maintenance tasks like PIN resets and account status changes.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <form action={updateKidPinAction} className="grid gap-3 rounded-[1.25rem] border border-[var(--line)] bg-white p-4">
                    <input type="hidden" name="userId" value={kid.id} />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        Security
                      </p>
                    </div>
                    <input
                      name="pin"
                      type="password"
                      inputMode="numeric"
                      pattern="\d{4,8}"
                      className={inputClass}
                      placeholder="New PIN"
                      required
                    />
                    <button className={ghostButtonClass}>Reset PIN</button>
                  </form>
                  <div className="grid gap-3 rounded-[1.25rem] border border-[var(--line)] bg-white p-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        Account Status
                      </p>
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      {kid.active
                        ? "Archive this account if you want it hidden from login and transfers."
                        : "Restore this account to make it available again."}
                    </p>
                    <form action={toggleKidAction}>
                      <input type="hidden" name="userId" value={kid.id} />
                      <input type="hidden" name="active" value={kid.active ? "false" : "true"} />
                      <button className={`${kid.active ? dangerButtonClass : primaryButtonClass} w-full`}>
                        {kid.active ? "Archive Account" : "Restore Account"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Rewards Catalog">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <form action={createRewardAction} className="grid gap-3 rounded-[1.4rem] border border-[var(--line)] bg-[var(--panel-strong)] p-4">
              <input name="title" className={inputClass} placeholder="Pick Friday movie" required />
              <textarea name="description" className={`${inputClass} min-h-24`} placeholder="What the reward means" />
              <input name="cost" type="number" min="1" className={inputClass} placeholder="Cost in Barnes Bucks" required />
              <button className={primaryButtonClass}>Add Reward</button>
            </form>

            <div className="grid gap-3">
              {rewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3">
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
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
