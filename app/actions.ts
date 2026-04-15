"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { clearSession, createSession, getSession } from "@/lib/auth";
import {
  canAfford,
  claimJob,
  createAdmin,
  createAdjustment,
  createJob,
  createKid,
  createReward,
  createRewardRedemption,
  createTransfer,
  getAdmin,
  getBalance,
  getUserById,
  hasAdmin,
  initializeDatabase,
  resolveJob,
  resolveRewardRedemption,
  submitJob,
  toggleRewardActive,
  toggleUserActive,
  updateKidPin,
  verifyPin,
} from "@/lib/data";

const pinSchema = z
  .string()
  .regex(/^\d{4,8}$/, "PINs should be 4 to 8 digits.");

const nameSchema = z.string().trim().min(2).max(30);
const noteSchema = z.string().trim().max(140).optional().default("");
const amountSchema = z.coerce.number().int().min(1).max(1000);
const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .default("#1d4ed8");

function bounce(message: string): never {
  redirect(`/?message=${encodeURIComponent(message)}`);
}

function requireAdminSession(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    bounce("Admin access is required for that action.");
  }

  return session;
}

function requireKidSession(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "kid") {
    bounce("Kid login required for that action.");
  }

  return session;
}

export async function setupAdminAction(formData: FormData) {
  initializeDatabase();

  if (hasAdmin()) {
    bounce("The Barnes Bucks bank is already set up.");
  }

  const name = nameSchema.safeParse(formData.get("name"));
  const pin = pinSchema.safeParse(formData.get("pin"));
  const confirmPin = pinSchema.safeParse(formData.get("confirmPin"));

  if (!name.success || !pin.success || !confirmPin.success) {
    bounce("Use a name and a 4 to 8 digit PIN for the bank admin.");
  }

  if (pin.data !== confirmPin.data) {
    bounce("Those admin PIN entries did not match.");
  }

  const userId = createAdmin(name.data, pin.data);
  await createSession({ userId, role: "admin" });
  redirect("/");
}

export async function adminLoginAction(formData: FormData) {
  initializeDatabase();
  const admin = getAdmin();
  const pin = pinSchema.safeParse(formData.get("pin"));

  if (!admin || !pin.success || !verifyPin(pin.data, admin.pinHash)) {
    bounce("That admin PIN did not work.");
  }

  await createSession({ userId: admin.id, role: "admin" });
  redirect("/");
}

export async function kidLoginAction(formData: FormData) {
  initializeDatabase();
  const userId = z.coerce.number().int().positive().safeParse(formData.get("userId"));
  const pin = pinSchema.safeParse(formData.get("pin"));

  if (!userId.success || !pin.success) {
    bounce("Choose a profile and enter a 4 to 8 digit PIN.");
  }

  const user = getUserById(userId.data);
  if (!user || user.role !== "kid" || !user.active || !verifyPin(pin.data, user.pinHash)) {
    bounce("That profile and PIN combination did not work.");
  }

  await createSession({ userId: user.id, role: "kid" });
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function createKidAction(formData: FormData) {
  initializeDatabase();
  requireAdminSession(await getSession());
  const name = nameSchema.safeParse(formData.get("name"));
  const pin = pinSchema.safeParse(formData.get("pin"));
  const color = colorSchema.safeParse(formData.get("color"));
  const avatar = z.string().trim().min(1).max(4).safeParse(formData.get("avatar"));

  if (!name.success || !pin.success || !color.success || !avatar.success) {
    bounce("Create each kid with a name, color, emoji, and 4 to 8 digit PIN.");
  }

  createKid(name.data, pin.data, color.data, avatar.data);
  redirect("/?message=New%20kid%20account%20created.");
}

export async function updateKidPinAction(formData: FormData) {
  initializeDatabase();
  requireAdminSession(await getSession());
  const userId = z.coerce.number().int().positive().safeParse(formData.get("userId"));
  const pin = pinSchema.safeParse(formData.get("pin"));

  if (!userId.success || !pin.success) {
    bounce("Enter a valid kid and a new 4 to 8 digit PIN.");
  }

  updateKidPin(userId.data, pin.data);
  redirect("/?message=PIN%20updated.");
}

export async function toggleKidAction(formData: FormData) {
  initializeDatabase();
  requireAdminSession(await getSession());
  const userId = z.coerce.number().int().positive().safeParse(formData.get("userId"));
  const active = z.string().safeParse(formData.get("active"));

  if (!userId.success || !active.success) {
    bounce("Could not update that account.");
  }

  toggleUserActive(userId.data, active.data === "true");
  redirect("/?message=Account%20updated.");
}

export async function adjustBalanceAction(formData: FormData) {
  initializeDatabase();
  const session = requireAdminSession(await getSession());
  const targetUserId = z.coerce.number().int().positive().safeParse(formData.get("userId"));
  const amount = amountSchema.safeParse(formData.get("amount"));
  const note = noteSchema.safeParse(formData.get("note"));
  const direction = z.enum(["deposit", "deduct"]).safeParse(formData.get("direction"));

  if (!targetUserId.success || !amount.success || !note.success || !direction.success) {
    bounce("Use a valid account, amount, and note.");
  }

  if (direction.data === "deduct" && !canAfford(targetUserId.data, amount.data)) {
    bounce("That account does not have enough Barnes Bucks.");
  }

  createAdjustment({
    actorUserId: session.userId,
    targetUserId: targetUserId.data,
    amount: amount.data,
    note: note.data,
    direction: direction.data,
  });

  redirect("/?message=Balance%20updated.");
}

export async function createTransferAction(formData: FormData) {
  initializeDatabase();
  const session = await getSession();
  if (!session) {
    bounce("Please log in to send Barnes Bucks.");
  }

  const toUserId = z.coerce.number().int().positive().safeParse(formData.get("toUserId"));
  const amount = amountSchema.safeParse(formData.get("amount"));
  const note = noteSchema.safeParse(formData.get("note"));

  if (!toUserId.success || !amount.success || !note.success) {
    bounce("Use a valid recipient and amount.");
  }

  let fromUserId = session.userId;

  if (session.role === "admin") {
    const chosenFrom = z.coerce.number().int().positive().safeParse(formData.get("fromUserId"));
    if (!chosenFrom.success) {
      bounce("Choose which account should send the Barnes Bucks.");
    }
    fromUserId = chosenFrom.data;
  }

  if (fromUserId === toUserId.data) {
    bounce("Transfers need two different accounts.");
  }

  if (!canAfford(fromUserId, amount.data)) {
    bounce("That account does not have enough Barnes Bucks.");
  }

  createTransfer({
    actorUserId: session.userId,
    fromUserId,
    toUserId: toUserId.data,
    amount: amount.data,
    note: note.data,
  });

  redirect("/?message=Transfer%20complete.");
}

export async function createJobAction(formData: FormData) {
  initializeDatabase();
  const session = await getSession();
  if (!session) {
    bounce("Please log in to post a job.");
  }

  const title = z.string().trim().min(3).max(50).safeParse(formData.get("title"));
  const description = z.string().trim().max(180).safeParse(formData.get("description"));
  const rewardAmount = amountSchema.safeParse(formData.get("rewardAmount"));

  if (!title.success || !description.success || !rewardAmount.success) {
    bounce("Each job needs a title, optional notes, and a reward amount.");
  }

  createJob({
    createdByUserId: session.userId,
    title: title.data,
    description: description.data,
    rewardAmount: rewardAmount.data,
  });

  redirect("/?message=Job%20posted.");
}

export async function claimJobAction(formData: FormData) {
  initializeDatabase();
  const session = requireKidSession(await getSession());
  const jobId = z.coerce.number().int().positive().safeParse(formData.get("jobId"));

  if (!jobId.success) {
    bounce("Could not claim that job.");
  }

  claimJob(jobId.data, session.userId);
  redirect("/?message=Job%20claimed.");
}

export async function submitJobAction(formData: FormData) {
  initializeDatabase();
  const session = requireKidSession(await getSession());
  const jobId = z.coerce.number().int().positive().safeParse(formData.get("jobId"));
  const note = noteSchema.safeParse(formData.get("note"));

  if (!jobId.success || !note.success) {
    bounce("Could not submit that job.");
  }

  submitJob(jobId.data, session.userId, note.data);
  redirect("/?message=Job%20submitted%20for%20approval.");
}

export async function resolveJobAction(formData: FormData) {
  initializeDatabase();
  const session = requireAdminSession(await getSession());
  const jobId = z.coerce.number().int().positive().safeParse(formData.get("jobId"));
  const decision = z.enum(["approve", "reject"]).safeParse(formData.get("decision"));

  if (!jobId.success || !decision.success) {
    bounce("Could not review that job.");
  }

  resolveJob({
    jobId: jobId.data,
    actorUserId: session.userId,
    approved: decision.data === "approve",
  });
  redirect("/?message=Job%20reviewed.");
}

export async function createRewardAction(formData: FormData) {
  initializeDatabase();
  requireAdminSession(await getSession());
  const title = z.string().trim().min(3).max(50).safeParse(formData.get("title"));
  const description = z.string().trim().max(160).safeParse(formData.get("description"));
  const cost = amountSchema.safeParse(formData.get("cost"));

  if (!title.success || !description.success || !cost.success) {
    bounce("Create rewards with a title, optional notes, and a cost.");
  }

  createReward(title.data, description.data, cost.data);
  redirect("/?message=Reward%20added.");
}

export async function toggleRewardAction(formData: FormData) {
  initializeDatabase();
  requireAdminSession(await getSession());
  const rewardId = z.coerce.number().int().positive().safeParse(formData.get("rewardId"));
  const active = z.string().safeParse(formData.get("active"));

  if (!rewardId.success || !active.success) {
    bounce("Could not update that reward.");
  }

  toggleRewardActive(rewardId.data, active.data === "true");
  redirect("/?message=Reward%20updated.");
}

export async function redeemRewardAction(formData: FormData) {
  initializeDatabase();
  const session = requireKidSession(await getSession());
  const rewardId = z.coerce.number().int().positive().safeParse(formData.get("rewardId"));
  const cost = amountSchema.safeParse(formData.get("cost"));
  const note = noteSchema.safeParse(formData.get("note"));

  if (!rewardId.success || !cost.success || !note.success) {
    bounce("Could not request that reward.");
  }

  if (getBalance(session.userId) < cost.data) {
    bounce("You need more Barnes Bucks before requesting that reward.");
  }

  createRewardRedemption(session.userId, rewardId.data, note.data);
  redirect("/?message=Reward%20request%20sent.");
}

export async function resolveRewardAction(formData: FormData) {
  initializeDatabase();
  const session = requireAdminSession(await getSession());
  const redemptionId = z.coerce.number().int().positive().safeParse(formData.get("redemptionId"));
  const decision = z.enum(["approve", "decline"]).safeParse(formData.get("decision"));

  if (!redemptionId.success || !decision.success) {
    bounce("Could not review that reward request.");
  }

  resolveRewardRedemption({
    redemptionId: redemptionId.data,
    actorUserId: session.userId,
    approved: decision.data === "approve",
  });
  redirect("/?message=Reward%20request%20reviewed.");
}
