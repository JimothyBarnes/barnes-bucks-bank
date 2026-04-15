import Database from "better-sqlite3";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import fs from "fs";
import path from "path";

export type SessionRole = "admin" | "kid";

export type UserSummary = {
  id: number;
  name: string;
  role: SessionRole;
  pinHash: string;
  color: string;
  avatar: string;
  active: number;
  balance: number;
  createdAt: string;
};

export type TransactionSummary = {
  id: number;
  type: string;
  amount: number;
  fromUserId: number | null;
  toUserId: number | null;
  actorUserId: number | null;
  note: string | null;
  createdAt: string;
  fromName: string | null;
  toName: string | null;
  actorName: string | null;
  jobTitle: string | null;
  rewardTitle: string | null;
};

export type JobSummary = {
  id: number;
  title: string;
  description: string | null;
  rewardAmount: number;
  status: string;
  createdByUserId: number;
  claimedByUserId: number | null;
  approvedByUserId: number | null;
  claimantNote: string | null;
  createdAt: string;
  updatedAt: string;
  creatorName: string;
  claimantName: string | null;
  approverName: string | null;
};

export type RewardSummary = {
  id: number;
  title: string;
  description: string | null;
  cost: number;
  active: number;
  createdAt: string;
};

export type RedemptionSummary = {
  id: number;
  rewardId: number;
  userId: number;
  approvedByUserId: number | null;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  rewardTitle: string;
  userName: string;
  approverName: string | null;
  rewardCost: number;
};

const dataDir = path.join(process.cwd(), "data");
const databasePath = path.join(dataDir, "barnes-bucks.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(databasePath);
db.pragma("journal_mode = WAL");

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'kid')),
      pin_hash TEXT NOT NULL,
      color TEXT NOT NULL,
      avatar TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK(amount > 0),
      from_user_id INTEGER,
      to_user_id INTEGER,
      actor_user_id INTEGER,
      note TEXT,
      job_id INTEGER,
      reward_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(from_user_id) REFERENCES users(id),
      FOREIGN KEY(to_user_id) REFERENCES users(id),
      FOREIGN KEY(actor_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      reward_amount INTEGER NOT NULL CHECK(reward_amount > 0),
      status TEXT NOT NULL CHECK(status IN ('open', 'claimed', 'submitted', 'approved', 'rejected', 'cancelled')) DEFAULT 'open',
      created_by_user_id INTEGER NOT NULL,
      claimed_by_user_id INTEGER,
      approved_by_user_id INTEGER,
      claimant_note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by_user_id) REFERENCES users(id),
      FOREIGN KEY(claimed_by_user_id) REFERENCES users(id),
      FOREIGN KEY(approved_by_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cost INTEGER NOT NULL CHECK(cost > 0),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reward_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      approved_by_user_id INTEGER,
      status TEXT NOT NULL CHECK(status IN ('requested', 'approved', 'declined')) DEFAULT 'requested',
      note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(reward_id) REFERENCES rewards(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(approved_by_user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_user_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(active);
    CREATE INDEX IF NOT EXISTS idx_redemptions_status ON reward_redemptions(status);
  `);

  seedRewards();
}

function seedRewards() {
  const existing = db.prepare("SELECT COUNT(*) AS count FROM rewards").get() as {
    count: number;
  };

  if (existing.count > 0) {
    return;
  }

  const insert = db.prepare(
    "INSERT INTO rewards (title, description, cost) VALUES (?, ?, ?)",
  );

  const defaults = [
    ["Extra 30 Minutes Up", "Stay up a little later for a special night.", 20],
    ["Pick Dessert", "Choose the family dessert this week.", 15],
    ["Screen Time Boost", "Earn an extra 20 minutes of screen time.", 25],
  ];

  for (const reward of defaults) {
    insert.run(...reward);
  }
}

function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");
  const derived = scryptSync(pin, salt, 64);
  const expected = Buffer.from(key, "hex");
  return timingSafeEqual(derived, expected);
}

export function hasAdmin() {
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND active = 1")
    .get() as { count: number };
  return row.count > 0;
}

export function createAdmin(name: string, pin: string) {
  const statement = db.prepare(
    "INSERT INTO users (name, role, pin_hash, color, avatar) VALUES (?, 'admin', ?, ?, ?)",
  );
  const result = statement.run(name.trim(), hashPin(pin), "#0f4c81", "BK");
  return Number(result.lastInsertRowid);
}

export function createKid(
  name: string,
  pin: string,
  color: string,
  avatar: string,
) {
  const statement = db.prepare(
    "INSERT INTO users (name, role, pin_hash, color, avatar) VALUES (?, 'kid', ?, ?, ?)",
  );
  const result = statement.run(name.trim(), hashPin(pin), color, avatar);
  return Number(result.lastInsertRowid);
}

export function updateKidPin(userId: number, pin: string) {
  db.prepare("UPDATE users SET pin_hash = ? WHERE id = ? AND role = 'kid'").run(
    hashPin(pin),
    userId,
  );
}

export function toggleUserActive(userId: number, active: boolean) {
  db.prepare("UPDATE users SET active = ? WHERE id = ? AND role = 'kid'").run(
    active ? 1 : 0,
    userId,
  );
}

export function getUserById(userId: number) {
  return db
    .prepare(
      `
      SELECT
        u.id,
        u.name,
        u.role,
        u.pin_hash AS pinHash,
        u.color,
        u.avatar,
        u.active,
        u.created_at AS createdAt,
        COALESCE(SUM(CASE WHEN t.to_user_id = u.id THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.from_user_id = u.id THEN t.amount ELSE 0 END), 0) AS balance
      FROM users u
      LEFT JOIN transactions t
        ON t.from_user_id = u.id OR t.to_user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
      `,
    )
    .get(userId) as UserSummary | undefined;
}

export function getAdmin() {
  return db
    .prepare(
      `
      SELECT
        u.id,
        u.name,
        u.role,
        u.pin_hash AS pinHash,
        u.color,
        u.avatar,
        u.active,
        u.created_at AS createdAt,
        COALESCE(SUM(CASE WHEN t.to_user_id = u.id THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.from_user_id = u.id THEN t.amount ELSE 0 END), 0) AS balance
      FROM users u
      LEFT JOIN transactions t
        ON t.from_user_id = u.id OR t.to_user_id = u.id
      WHERE u.role = 'admin' AND u.active = 1
      GROUP BY u.id
      LIMIT 1
      `,
    )
    .get() as UserSummary | undefined;
}

export function getKids(activeOnly = true) {
  return db
    .prepare(
      `
      SELECT
        u.id,
        u.name,
        u.role,
        u.pin_hash AS pinHash,
        u.color,
        u.avatar,
        u.active,
        u.created_at AS createdAt,
        COALESCE(SUM(CASE WHEN t.to_user_id = u.id THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.from_user_id = u.id THEN t.amount ELSE 0 END), 0) AS balance
      FROM users u
      LEFT JOIN transactions t
        ON t.from_user_id = u.id OR t.to_user_id = u.id
      WHERE u.role = 'kid' ${activeOnly ? "AND u.active = 1" : ""}
      GROUP BY u.id
      ORDER BY u.active DESC, u.name ASC
      `,
    )
    .all() as UserSummary[];
}

export function getActiveRewards() {
  return db
    .prepare(
      `
      SELECT
        id,
        title,
        description,
        cost,
        active,
        created_at AS createdAt
      FROM rewards
      WHERE active = 1
      ORDER BY cost ASC, title ASC
      `,
    )
    .all() as RewardSummary[];
}

export function getAllRewards() {
  return db
    .prepare(
      `
      SELECT
        id,
        title,
        description,
        cost,
        active,
        created_at AS createdAt
      FROM rewards
      ORDER BY active DESC, cost ASC, title ASC
      `,
    )
    .all() as RewardSummary[];
}

export function createReward(title: string, description: string, cost: number) {
  db.prepare("INSERT INTO rewards (title, description, cost) VALUES (?, ?, ?)").run(
    title.trim(),
    description.trim() || null,
    cost,
  );
}

export function toggleRewardActive(rewardId: number, active: boolean) {
  db.prepare("UPDATE rewards SET active = ? WHERE id = ?").run(active ? 1 : 0, rewardId);
}

export function getRecentTransactions(limit = 25) {
  return db
    .prepare(
      `
      SELECT
        t.id,
        t.type,
        t.amount,
        t.from_user_id AS fromUserId,
        t.to_user_id AS toUserId,
        t.actor_user_id AS actorUserId,
        t.note,
        t.created_at AS createdAt,
        fu.name AS fromName,
        tu.name AS toName,
        au.name AS actorName,
        j.title AS jobTitle,
        r.title AS rewardTitle
      FROM transactions t
      LEFT JOIN users fu ON fu.id = t.from_user_id
      LEFT JOIN users tu ON tu.id = t.to_user_id
      LEFT JOIN users au ON au.id = t.actor_user_id
      LEFT JOIN jobs j ON j.id = t.job_id
      LEFT JOIN rewards r ON r.id = t.reward_id
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT ?
      `,
    )
    .all(limit) as TransactionSummary[];
}

export function getRecentTransactionsForUser(userId: number, limit = 12) {
  return db
    .prepare(
      `
      SELECT
        t.id,
        t.type,
        t.amount,
        t.from_user_id AS fromUserId,
        t.to_user_id AS toUserId,
        t.actor_user_id AS actorUserId,
        t.note,
        t.created_at AS createdAt,
        fu.name AS fromName,
        tu.name AS toName,
        au.name AS actorName,
        j.title AS jobTitle,
        r.title AS rewardTitle
      FROM transactions t
      LEFT JOIN users fu ON fu.id = t.from_user_id
      LEFT JOIN users tu ON tu.id = t.to_user_id
      LEFT JOIN users au ON au.id = t.actor_user_id
      LEFT JOIN jobs j ON j.id = t.job_id
      LEFT JOIN rewards r ON r.id = t.reward_id
      WHERE t.from_user_id = ? OR t.to_user_id = ?
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT ?
      `,
    )
    .all(userId, userId, limit) as TransactionSummary[];
}

export function createAdjustment(options: {
  actorUserId: number;
  targetUserId: number;
  amount: number;
  note: string;
  direction: "deposit" | "deduct";
}) {
  const { actorUserId, targetUserId, amount, note, direction } = options;

  db.prepare(
    `
    INSERT INTO transactions (type, amount, from_user_id, to_user_id, actor_user_id, note)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
  ).run(
    direction === "deposit" ? "admin_deposit" : "admin_deduction",
    amount,
    direction === "deduct" ? targetUserId : null,
    direction === "deposit" ? targetUserId : null,
    actorUserId,
    note.trim(),
  );
}

export function createTransfer(options: {
  actorUserId: number;
  fromUserId: number;
  toUserId: number;
  amount: number;
  note: string;
}) {
  const { actorUserId, fromUserId, toUserId, amount, note } = options;

  db.prepare(
    `
    INSERT INTO transactions (type, amount, from_user_id, to_user_id, actor_user_id, note)
    VALUES ('transfer', ?, ?, ?, ?, ?)
    `,
  ).run(amount, fromUserId, toUserId, actorUserId, note.trim() || null);
}

export function getBalance(userId: number) {
  const row = db
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN to_user_id = ? THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN from_user_id = ? THEN amount ELSE 0 END), 0) AS balance
      FROM transactions
      WHERE to_user_id = ? OR from_user_id = ?
      `,
    )
    .get(userId, userId, userId, userId) as { balance: number | null };

  return Number(row.balance ?? 0);
}

export function getJobs() {
  return db
    .prepare(
      `
      SELECT
        j.id,
        j.title,
        j.description,
        j.reward_amount AS rewardAmount,
        j.status,
        j.created_by_user_id AS createdByUserId,
        j.claimed_by_user_id AS claimedByUserId,
        j.approved_by_user_id AS approvedByUserId,
        j.claimant_note AS claimantNote,
        j.created_at AS createdAt,
        j.updated_at AS updatedAt,
        creator.name AS creatorName,
        claimant.name AS claimantName,
        approver.name AS approverName
      FROM jobs j
      JOIN users creator ON creator.id = j.created_by_user_id
      LEFT JOIN users claimant ON claimant.id = j.claimed_by_user_id
      LEFT JOIN users approver ON approver.id = j.approved_by_user_id
      ORDER BY
        CASE j.status
          WHEN 'submitted' THEN 1
          WHEN 'claimed' THEN 2
          WHEN 'open' THEN 3
          ELSE 4
        END,
        j.updated_at DESC,
        j.id DESC
      `,
    )
    .all() as JobSummary[];
}

export function createJob(options: {
  createdByUserId: number;
  title: string;
  description: string;
  rewardAmount: number;
}) {
  const { createdByUserId, title, description, rewardAmount } = options;

  db.prepare(
    `
    INSERT INTO jobs (title, description, reward_amount, created_by_user_id)
    VALUES (?, ?, ?, ?)
    `,
  ).run(title.trim(), description.trim() || null, rewardAmount, createdByUserId);
}

export function claimJob(jobId: number, userId: number) {
  db.prepare(
    `
    UPDATE jobs
    SET status = 'claimed',
        claimed_by_user_id = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'open'
    `,
  ).run(userId, jobId);
}

export function submitJob(jobId: number, userId: number, note: string) {
  db.prepare(
    `
    UPDATE jobs
    SET status = 'submitted',
        claimant_note = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND status = 'claimed' AND claimed_by_user_id = ?
    `,
  ).run(note.trim() || null, jobId, userId);
}

export function resolveJob(options: {
  jobId: number;
  actorUserId: number;
  approved: boolean;
}) {
  const { jobId, actorUserId, approved } = options;
  const job = db
    .prepare(
      `
      SELECT id, title, reward_amount AS rewardAmount, claimed_by_user_id AS claimedByUserId, status
      FROM jobs
      WHERE id = ?
      `,
    )
    .get(jobId) as
    | { id: number; title: string; rewardAmount: number; claimedByUserId: number | null; status: string }
    | undefined;

  if (!job || job.status !== "submitted" || !job.claimedByUserId) {
    return;
  }

  const transaction = db.transaction(() => {
    db.prepare(
      `
      UPDATE jobs
      SET status = ?,
          approved_by_user_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
    ).run(approved ? "approved" : "rejected", actorUserId, jobId);

    if (approved) {
      db.prepare(
        `
        INSERT INTO transactions (type, amount, to_user_id, actor_user_id, note, job_id)
        VALUES ('job_reward', ?, ?, ?, ?, ?)
        `,
      ).run(
        job.rewardAmount,
        job.claimedByUserId,
        actorUserId,
        `Approved job: ${job.title}`,
        jobId,
      );
    }
  });

  transaction();
}

export function createRewardRedemption(userId: number, rewardId: number, note: string) {
  db.prepare(
    `
    INSERT INTO reward_redemptions (reward_id, user_id, note)
    VALUES (?, ?, ?)
    `,
  ).run(rewardId, userId, note.trim() || null);
}

export function getRedemptions() {
  return db
    .prepare(
      `
      SELECT
        rr.id,
        rr.reward_id AS rewardId,
        rr.user_id AS userId,
        rr.approved_by_user_id AS approvedByUserId,
        rr.status,
        rr.note,
        rr.created_at AS createdAt,
        rr.updated_at AS updatedAt,
        r.title AS rewardTitle,
        r.cost AS rewardCost,
        u.name AS userName,
        approver.name AS approverName
      FROM reward_redemptions rr
      JOIN rewards r ON r.id = rr.reward_id
      JOIN users u ON u.id = rr.user_id
      LEFT JOIN users approver ON approver.id = rr.approved_by_user_id
      ORDER BY
        CASE rr.status
          WHEN 'requested' THEN 1
          ELSE 2
        END,
        rr.updated_at DESC,
        rr.id DESC
      `,
    )
    .all() as RedemptionSummary[];
}

export function resolveRewardRedemption(options: {
  redemptionId: number;
  actorUserId: number;
  approved: boolean;
}) {
  const { redemptionId, actorUserId, approved } = options;
  const redemption = db
    .prepare(
      `
      SELECT
        rr.id,
        rr.reward_id AS rewardId,
        rr.user_id AS userId,
        rr.status,
        r.title AS rewardTitle,
        r.cost AS rewardCost
      FROM reward_redemptions rr
      JOIN rewards r ON r.id = rr.reward_id
      WHERE rr.id = ?
      `,
    )
    .get(redemptionId) as
    | {
        id: number;
        rewardId: number;
        userId: number;
        status: string;
        rewardTitle: string;
        rewardCost: number;
      }
    | undefined;

  if (!redemption || redemption.status !== "requested") {
    return;
  }

  const transaction = db.transaction(() => {
    db.prepare(
      `
      UPDATE reward_redemptions
      SET status = ?,
          approved_by_user_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
    ).run(approved ? "approved" : "declined", actorUserId, redemptionId);

    if (approved) {
      db.prepare(
        `
        INSERT INTO transactions (type, amount, from_user_id, actor_user_id, note, reward_id)
        VALUES ('reward_redemption', ?, ?, ?, ?, ?)
        `,
      ).run(
        redemption.rewardCost,
        redemption.userId,
        actorUserId,
        `Redeemed reward: ${redemption.rewardTitle}`,
        redemption.rewardId,
      );
    }
  });

  transaction();
}

export function canAfford(userId: number, amount: number) {
  return getBalance(userId) >= amount;
}
