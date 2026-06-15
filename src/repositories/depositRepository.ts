import { BaseRepository } from "./baseRepository";
import { DepositStatus, InvestmentStatus, TransactionType, TransactionStatus } from "@prisma/client";
import { notificationService } from "@/services/notificationService";

export class DepositRepository extends BaseRepository {
  async findByUserId(userId: string) {
    const startTime = Date.now();
    const results = await this.db.deposit.findMany({
      where: this.excludeDeleted({ userId }),
      include: {
        plan: true,
        wallet: true,
      },
      orderBy: { createdAt: "desc" },
    });
    this.logQueryDuration("DepositRepository.findByUserId", Date.now() - startTime);
    return results;
  }

  async findAll() {
    const startTime = Date.now();
    const results = await this.db.deposit.findMany({
      where: this.excludeDeleted({}),
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: true,
          },
        },
        plan: true,
        wallet: true,
      },
      orderBy: { createdAt: "desc" },
    });
    this.logQueryDuration("DepositRepository.findAll", Date.now() - startTime);
    return results;
  }

  async findById(id: string) {
    const startTime = Date.now();
    const result = await this.db.deposit.findFirst({
      where: this.excludeDeleted({ id }),
      include: {
        user: true,
        plan: true,
        wallet: true,
      },
    });
    this.logQueryDuration("DepositRepository.findById", Date.now() - startTime);
    return result;
  }

  async create(data: { userId: string; planId: string; amount: number; walletId: string; proofUrl?: string; durationMonths?: number; companyName?: string }) {
    const startTime = Date.now();
    const result = await this.db.deposit.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        amount: data.amount,
        walletId: data.walletId,
        proofUrl: data.proofUrl || null,
        durationMonths: data.durationMonths || 3,
        companyName: data.companyName || null,
        status: DepositStatus.PENDING,
      },
      include: {
        plan: true,
        wallet: true,
      },
    });
    this.logQueryDuration("DepositRepository.create", Date.now() - startTime);
    return result;
  }

  async approve(id: string, confirmedAmount?: number, updatePortfolioOverride?: boolean) {
    const startTime = Date.now();
    const result = await this.db.$transaction(async (tx) => {
      const deposit = await tx.deposit.update({
        where: { id },
        data: { status: DepositStatus.APPROVED },
        include: { plan: true },
      });

      const finalAmount = typeof confirmedAmount === "number" ? confirmedAmount : deposit.amount;

      // Create a successful Transaction
      const ref = `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await tx.transaction.create({
        data: {
          userId: deposit.userId,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.SUCCESS,
          amount: finalAmount,
          reference: ref,
          description: `Approved deposit for ${deposit.plan.name} Plan`,
        },
      });

      // Create user active investment
      await tx.investment.create({
        data: {
          userId: deposit.userId,
          planId: deposit.planId,
          amount: finalAmount,
          balance: finalAmount,
          durationMonths: deposit.durationMonths,
          companyName: deposit.companyName,
          status: InvestmentStatus.ACTIVE,
        },
      });

      // Update manual profile stats if requested
      if (updatePortfolioOverride) {
        const profile = await tx.profile.findUnique({
          where: { userId: deposit.userId }
        });
        if (profile) {
          const currentPortfolio = profile.customPortfolioValue !== null ? profile.customPortfolioValue : 0;
          const currentTotal = profile.customTotalInvestment !== null ? profile.customTotalInvestment : 0;
          await tx.profile.update({
            where: { userId: deposit.userId },
            data: {
              customPortfolioValue: currentPortfolio + finalAmount,
              customTotalInvestment: currentTotal + finalAmount,
            }
          });
        }
      }

      // Notify User
      await notificationService.sendDepositApproved(deposit.userId, finalAmount, deposit.plan.name, tx);

      return deposit;
    });
    this.logQueryDuration("DepositRepository.approve", Date.now() - startTime);
    return result;
  }

  async reject(id: string) {
    const startTime = Date.now();
    const result = await this.db.$transaction(async (tx) => {
      const deposit = await tx.deposit.update({
        where: { id },
        data: { status: DepositStatus.REJECTED },
        include: { plan: true },
      });

      // Create failed transaction
      const ref = `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await tx.transaction.create({
        data: {
          userId: deposit.userId,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.FAILED,
          amount: deposit.amount,
          reference: ref,
          description: `Rejected deposit for ${deposit.plan.name} Plan`,
        },
      });

      // Notify User
      await tx.notification.create({
        data: {
          userId: deposit.userId,
          title: "Deposit Rejected",
          message: `Your deposit of $${deposit.amount.toLocaleString()} for the ${deposit.plan.name} plan could not be verified and has been rejected.`,
        },
      });

      return deposit;
    });
    this.logQueryDuration("DepositRepository.reject", Date.now() - startTime);
    return result;
  }
}

export const depositRepository = new DepositRepository();
export default depositRepository;
