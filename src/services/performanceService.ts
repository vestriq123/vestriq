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
    createdAt?: Date;
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
          ...(data.createdAt ? { createdAt: data.createdAt } : {}),
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

  async deleteRecord(data: {
    recordId: string;
    adminUserId: string;
  }) {
    const record = await db.performanceRecord.findUnique({
      where: { id: data.recordId },
      include: {
        investment: {
          include: {
            plan: true,
          }
        }
      }
    });

    if (!record) {
      throw ApiError.notFound("Performance record not found");
    }

    if (record.investment.status !== InvestmentStatus.ACTIVE) {
      throw ApiError.badRequest("Only active investments can have performance records deleted");
    }

    const nextBalance = record.investment.balance - record.amount;

    if (nextBalance < 0) {
      throw ApiError.badRequest("Deleting this record would reduce investment balance below zero");
    }

    return db.$transaction(async (tx) => {
      const updatedInvestment = await tx.investment.update({
        where: { id: record.investmentId },
        data: {
          balance: nextBalance,
          status: nextBalance === 0 ? InvestmentStatus.COMPLETED : InvestmentStatus.ACTIVE,
        },
      });

      await tx.performanceRecord.delete({
        where: { id: record.id },
      });

      await tx.transaction.create({
        data: {
          userId: record.investment.userId,
          type: TransactionType.ADJUSTMENT,
          status: TransactionStatus.SUCCESS,
          amount: -record.amount,
          reference: `PERF-DEL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          description: `Reversal: Deleted performance record of type ${record.type} for ${record.investment.plan.name}`,
        },
      });

      await notificationService.sendPortfolioUpdated(
        record.investment.userId,
        -record.amount,
        nextBalance,
        "ADJUSTMENT",
        "Performance record correction",
        tx
      );

      await tx.auditLog.create({
        data: {
          userId: data.adminUserId,
          action: "investment.performance.delete",
          details: JSON.stringify({
            investmentId: record.investmentId,
            recordId: record.id,
            type: record.type,
            amount: record.amount,
            previousBalance: record.investment.balance,
            nextBalance,
          }),
        },
      });

      return {
        success: true,
        investment: updatedInvestment,
      };
    });
  }
}

export const performanceService = new PerformanceService();
export default performanceService;
