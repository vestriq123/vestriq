import { ApiError } from "@/lib/errors";
import { db } from "@/lib/db";
import { InvestmentStatus, TransactionStatus, TransactionType } from "@prisma/client";
import { notificationService } from "./notificationService";

export type PerformanceUpdateType = "PROFIT" | "LOSS" | "BONUS" | "ADJUSTMENT";

export class PerformanceService {
  async applyUpdate(data: {
    investmentId: string;
    adminUserId: string;
    amount: number;
    type: PerformanceUpdateType;
    note?: string;
  }) {
    const investment = await db.investment.findFirst({
      where: {
        id: data.investmentId,
        deletedAt: null,
      },
      include: {
        plan: true,
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!investment) {
      throw ApiError.notFound("Investment not found");
    }

    if (investment.status !== InvestmentStatus.ACTIVE) {
      throw ApiError.badRequest("Only active investments can receive performance updates");
    }

    const signedAmount = this.toSignedAmount(data.amount, data.type);
    const nextBalance = investment.balance + signedAmount;

    if (nextBalance < 0) {
      throw ApiError.badRequest("Performance update cannot reduce investment balance below zero");
    }

    return db.$transaction(async (tx) => {
      const updatedInvestment = await tx.investment.update({
        where: { id: investment.id },
        data: {
          balance: nextBalance,
          status: nextBalance === 0 ? InvestmentStatus.COMPLETED : InvestmentStatus.ACTIVE,
        },
        include: {
          plan: true,
          user: {
            include: {
              profile: true,
            },
          },
          performanceRecords: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      const performanceRecord = await tx.performanceRecord.create({
        data: {
          investmentId: investment.id,
          amount: signedAmount,
          type: data.type,
          note: data.note || null,
        },
      });

      await tx.transaction.create({
        data: {
          userId: investment.userId,
          type: data.type === "BONUS" ? TransactionType.BONUS : TransactionType.ADJUSTMENT,
          status: TransactionStatus.SUCCESS,
          amount: signedAmount,
          reference: `PERF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          description: `${data.type.replace("_", " ")} update for ${investment.plan.name}`,
        },
      });

      if (data.type === "BONUS") {
        await notificationService.sendBonusAdded(investment.userId, signedAmount, nextBalance, data.note, tx);
      } else {
        await notificationService.sendPortfolioUpdated(investment.userId, signedAmount, nextBalance, data.type, data.note, tx);
      }

      await tx.auditLog.create({
        data: {
          userId: data.adminUserId,
          action: "investment.performance.update",
          details: JSON.stringify({
            investmentId: investment.id,
            investorId: investment.userId,
            type: data.type,
            amount: signedAmount,
            previousBalance: investment.balance,
            nextBalance,
          }),
        },
      });

      return {
        investment: updatedInvestment,
        performanceRecord,
      };
    });
  }

  private toSignedAmount(amount: number, type: PerformanceUpdateType) {
    const absoluteAmount = Math.abs(amount);
    if (type === "LOSS") return -absoluteAmount;
    if (type === "ADJUSTMENT") return amount;
    return absoluteAmount;
  }

  private notificationTitle(type: PerformanceUpdateType) {
    if (type === "BONUS") return "Bonus Applied";
    if (type === "LOSS") return "Portfolio Adjustment Applied";
    if (type === "PROFIT") return "Performance Update Applied";
    return "Investment Adjustment Applied";
  }

  private formatSignedAmount(amount: number) {
    const prefix = amount >= 0 ? "+" : "-";
    return `${prefix}$${Math.abs(amount).toLocaleString()}`;
  }
}

export const performanceService = new PerformanceService();
export default performanceService;
