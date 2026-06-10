import { getSession } from "@/lib/auth";
import { apiHandler, successResponse, errorResponse } from "@/lib/api";
import { validateBody } from "@/lib/validate";
import { db } from "@/lib/db";
import { z } from "zod";

const createWalletSchema = z.object({
  name: z.string().min(1, "Wallet name is required"),
  address: z.string().min(8, "Wallet address must be at least 8 characters long"),
});

export const GET = apiHandler(async () => {
  const session = await getSession();
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const isAdmin = session.role === "ADMIN";

  // Find active wallets
  const wallets = await db.wallet.findMany({
    where: {
      deletedAt: null,
      ...(isAdmin ? {} : { enabled: true }),
    },
    orderBy: { name: "asc" },
  });

  return successResponse(wallets, "Configured payment wallets retrieved");
});

export const POST = apiHandler(async (request: Request) => {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const data = await validateBody(request, createWalletSchema);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.address)}`;

  const wallet = await db.wallet.create({
    data: {
      name: data.name,
      address: data.address,
      qrCodeUrl,
      enabled: true,
    },
  });

  return successResponse(wallet, "Wallet created successfully");
});
