import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { validateBody } from "@/lib/validate";
import { db } from "@/lib/db";
import { z } from "zod";

const updateWalletSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(8).optional(),
  enabled: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export const PUT = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const data = await validateBody(request, updateWalletSchema);

  // Check if wallet exists
  const wallet = await db.wallet.findFirst({
    where: { id, deletedAt: null },
  });

  if (!wallet) {
    return errorResponse("Wallet not found", 404);
  }

  // Build updates
  const updateData: { name?: string; address?: string; qrCodeUrl?: string; enabled?: boolean } = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.address !== undefined) {
    updateData.address = data.address;
    updateData.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.address)}`;
  }
  if (data.enabled !== undefined) updateData.enabled = data.enabled;

  const updatedWallet = await db.wallet.update({
    where: { id },
    data: updateData,
  });

  return successResponse(updatedWallet, "Wallet updated successfully");
});

export const DELETE = apiHandler(async (request: Request, context: unknown) => {
  const { id } = await (context as RouteContext).params;
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const wallet = await db.wallet.findFirst({
    where: { id, deletedAt: null },
  });

  if (!wallet) {
    return errorResponse("Wallet not found", 404);
  }

  await db.wallet.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      enabled: false,
    },
  });

  return successResponse(null, "Wallet deleted successfully");
});
