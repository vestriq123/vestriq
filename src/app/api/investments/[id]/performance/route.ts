import { getSession } from "@/lib/auth";
import { apiHandler, errorResponse, successResponse } from "@/lib/api";
import { validateBody } from "@/lib/validate";
import { performanceService } from "@/services/performanceService";
import { z } from "zod";

const performanceUpdateSchema = z.object({
  type: z.enum(["PROFIT", "LOSS", "BONUS", "ADJUSTMENT"]),
  amount: z.number().refine((value) => value !== 0, "Amount cannot be zero"),
  note: z.string().max(500, "Note is too long").optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export const POST = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const data = await validateBody(request, performanceUpdateSchema);
  const result = await performanceService.applyUpdate({
    investmentId: id,
    adminUserId: session.userId,
    type: data.type,
    amount: data.amount,
    note: data.note,
  });

  return successResponse(result, "Investment performance update applied successfully");
});
