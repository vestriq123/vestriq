import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { withdrawalRepository } from "@/repositories/withdrawalRepository";
import { WithdrawalStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const withdrawal = await withdrawalRepository.findById(id);
  if (!withdrawal) {
    return errorResponse("Withdrawal request not found", 404);
  }

  if (withdrawal.status !== WithdrawalStatus.PENDING) {
    return errorResponse("Only pending withdrawals can be rejected", 400);
  }

  const updatedWithdrawal = await withdrawalRepository.reject(id);
  return successResponse(updatedWithdrawal, "Withdrawal request has been rejected");
});
