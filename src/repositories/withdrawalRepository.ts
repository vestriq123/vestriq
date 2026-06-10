import { BaseRepository } from "./baseRepository";
import { WithdrawalStatus, InvestmentStatus, TransactionType, TransactionStatus } from "@prisma/client";
import { notificationService } from "@/services/notificationService";

export class WithdrawalRepository extends BaseRepository {
  async findByUserId(userId: string) {
    const startTime = Date.now();
    const results = await this.db.withdrawal.findMany({
      where: this.excludeDeleted({ userId }),
      orderBy: { createdAt: "desc" },
    });
    this.logQueryDuration("WithdrawalRepository.findByUserId", Date.now() - startTime);
    return results;
  }

  async findAll() {
    const startTime = Date.now();
    const results = await this.db.withdrawal.findMany({
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
      },
      orderBy: { createdAt: "desc" },
    });
    this.logQueryDuration("WithdrawalRepository.findAll", Date.now() - startTime);
    return results;
  }

  async findById(id: string) {
    const startTime = Date.now();
    const result = await this.db.withdrawal.findFirst({
      where: this.excludeDeleted({ id }),
      include: {
        user: true,
      },
    });
    this.logQueryDuration("WithdrawalRepository.findById", Date.now() - startTime);
    return result;
  }

  async create(data: { userId: string; amount: number; address: string }) {
    const startTime = Date.now();
    const result = await this.db.withdrawal.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        address: data.address,
        status: WithdrawalStatus.PENDING,
      },
    });
    this.logQueryDuration("WithdrawalRepository.create", Date.now() - startTime);
    return result;
  }

  async approve(id: string) {
    const startTime = Date.now();
    const result = await this.db.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.update({
        where: { id },
        data: { status: WithdrawalStatus.APPROVED },
      });

      // Deduct from User's active investments
      const activeInvestments = await tx.investment.findMany({
        where: {
          userId: withdrawal.userId,
          status: InvestmentStatus.ACTIVE,
          deletedAt: null,
        },
        orderBy: { createdAt: "asc" }, // Deduct from oldest first
      });

      let remainingToDeduct = withdrawal.amount;

      for (const investment of activeInvestments) {
        if (remainingToDeduct <= 0) break;

        if (investment.balance >= remainingToDeduct) {
          const newBalance = investment.balance - remainingToDeduct;
          await tx.investment.update({
            where: { id: investment.id },
            data: {
              balance: newBalance,
              status: newBalance === 0 ? InvestmentStatus.COMPLETED : InvestmentStatus.ACTIVE,
            },
          });
          // Log performance record
          await tx.performanceRecord.create({
            data: {
              investmentId: investment.id,
              amount: -remainingToDeduct,
              type: "ADJUSTMENT",
              note: `Subtracted for withdrawal request ${withdrawal.id}`,
            },
          });
          remainingToDeduct = 0;
        } else {
          await tx.investment.update({
            where: { id: investment.id },
            data: {
              balance: 0,
              status: InvestmentStatus.COMPLETED,
            },
          });
          // Log performance record
          await tx.performanceRecord.create({
            data: {
              investmentId: investment.id,
              amount: -investment.balance,
              type: "ADJUSTMENT",
              note: `Subtracted remaining balance for withdrawal request ${withdrawal.id}`,
            },
          });
          remainingToDeduct -= investment.balance;
        }
      }

      // Create transaction log
      const ref = `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await tx.transaction.create({
        data: {
          userId: withdrawal.userId,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.SUCCESS,
          amount: withdrawal.amount,
          reference: ref,
          description: `Processed withdrawal of $${withdrawal.amount.toLocaleString()} to ${withdrawal.address}`,
        },
      });

      // Send Notification
      await notificationService.sendWithdrawalApproved(withdrawal.userId, withdrawal.amount, withdrawal.address, tx);

      return withdrawal;
    });
    this.logQueryDuration("WithdrawalRepository.approve", Date.now() - startTime);
    return result;
  }

  async reject(id: string) {
    const startTime = Date.now();
    const result = await this.db.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.update({
        where: { id },
        data: { status: WithdrawalStatus.REJECTED },
      });

      // Create transaction log
      const ref = `TXN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      await tx.transaction.create({
        data: {
          userId: withdrawal.userId,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.FAILED,
          amount: withdrawal.amount,
          reference: ref,
          description: `Rejected withdrawal of $${withdrawal.amount.toLocaleString()}`,
        },
      });

      // Send Notification
      await tx.notification.create({
        data: {
          userId: withdrawal.userId,
          title: "Withdrawal Rejected",
          message: `Your withdrawal request of $${withdrawal.amount.toLocaleString()} has been rejected. Please review details and resubmit.`,
        },
      });

      return withdrawal;
    });
    this.logQueryDuration("WithdrawalRepository.reject", Date.now() - startTime);
    return result;
  }
}

export const withdrawalRepository = new WithdrawalRepository();
export default withdrawalRepository;
