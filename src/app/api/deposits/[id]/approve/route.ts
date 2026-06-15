import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { depositRepository } from "@/repositories/depositRepository";
import { DepositStatus } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const deposit = await depositRepository.findById(id);
  if (!deposit) {
    return errorResponse("Deposit request not found", 404);
  }

  if (deposit.status !== DepositStatus.PENDING) {
    return errorResponse("Only pending deposits can be approved", 400);
  }

  let body = { confirmedAmount: undefined, updatePortfolioOverride: false };
  try {
    body = await request.json();
  } catch (e) {
    // Body is optional
  }

  const updatedDeposit = await depositRepository.approve(
    id,
    body.confirmedAmount,
    body.updatePortfolioOverride
  );
  return successResponse(updatedDeposit, "Deposit request has been approved successfully");
});
