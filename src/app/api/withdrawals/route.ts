import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { validateBody } from "@/lib/validate";
import { withdrawalRepository } from "@/repositories/withdrawalRepository";
import { db } from "@/lib/db";
import { z } from "zod";

const createWithdrawalSchema = z.object({
  amount: z.number().positive("Withdrawal amount must be positive"),
  address: z.string().min(10, "Invalid destination address length"),
});

export const GET = apiHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const queryUserId = searchParams.get("userId");

  // Admin can query all or specific user's payouts
  if (session.role === "ADMIN") {
    if (queryUserId) {
      const withdrawals = await withdrawalRepository.findByUserId(queryUserId);
      return successResponse(withdrawals, "User withdrawals retrieved successfully");
    }
    const withdrawals = await withdrawalRepository.findAll();
    return successResponse(withdrawals, "All withdrawals retrieved successfully");
  }

  // Regular user retrieves their own payouts
  const withdrawals = await withdrawalRepository.findByUserId(session.userId);
  return successResponse(withdrawals, "Your withdrawals retrieved successfully");
});

export const POST = apiHandler(async (request: Request) => {
  const session = await getSession();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const data = await validateBody(request, createWithdrawalSchema);

  // Calculate user's current active balance
  const activeInvestments = await db.investment.findMany({
    where: {
      userId: session.userId,
      status: "ACTIVE",
      deletedAt: null,
    },
  });
  const totalBalance = activeInvestments.reduce((sum, inv) => sum + inv.balance, 0);

  // Calculate pending withdrawals to avoid double spending
  const pendingWithdrawals = await db.withdrawal.findMany({
    where: {
      userId: session.userId,
      status: "PENDING",
      deletedAt: null,
    },
  });
  const totalPending = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  const withdrawableBalance = totalBalance - totalPending;

  if (data.amount > withdrawableBalance) {
    return errorResponse(
      `Insufficient funds. Your withdrawable balance is $${withdrawableBalance.toLocaleString()}.`,
      400
    );
  }

  const withdrawal = await withdrawalRepository.create({
    userId: session.userId,
    amount: data.amount,
    address: data.address,
  });

  return successResponse(withdrawal, "Withdrawal request submitted successfully. Processing will conclude within 48 hours.", 201);
});
