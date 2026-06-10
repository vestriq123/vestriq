import { BaseRepository } from "./baseRepository";
import { InvestmentStatus } from "@prisma/client";

export class InvestmentRepository extends BaseRepository {
  async findAll() {
    const startTime = Date.now();
    const results = await this.db.investment.findMany({
      where: this.excludeDeleted({}),
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: true,
          },
        },
        performanceRecords: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    this.logQueryDuration("InvestmentRepository.findAll", Date.now() - startTime);
    return results;
  }

  async findByUserId(userId: string) {
    const startTime = Date.now();
    const results = await this.db.investment.findMany({
      where: this.excludeDeleted({ userId }),
      include: {
        plan: true,
        performanceRecords: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    this.logQueryDuration("InvestmentRepository.findByUserId", Date.now() - startTime);
    return results;
  }

  async findById(id: string) {
    const startTime = Date.now();
    const result = await this.db.investment.findFirst({
      where: this.excludeDeleted({ id }),
      include: {
        plan: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        performanceRecords: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    this.logQueryDuration("InvestmentRepository.findById", Date.now() - startTime);
    return result;
  }

  async create(data: { userId: string; planId: string; amount: number; balance: number }) {
    const startTime = Date.now();
    const result = await this.db.investment.create({
      data: {
        userId: data.userId,
        planId: data.planId,
        amount: data.amount,
        balance: data.balance,
        status: InvestmentStatus.ACTIVE,
      },
      include: {
        plan: true,
      },
    });
    this.logQueryDuration("InvestmentRepository.create", Date.now() - startTime);
    return result;
  }

  async updateBalance(id: string, newBalance: number, adjustmentAmount: number, type: string, note?: string) {
    const startTime = Date.now();
    const result = await this.db.$transaction(async (tx) => {
      const investment = await tx.investment.update({
        where: { id },
        data: { balance: newBalance },
      });

      await tx.performanceRecord.create({
        data: {
          investmentId: id,
          amount: adjustmentAmount,
          type,
          note,
        },
      });

      return investment;
    });
    this.logQueryDuration("InvestmentRepository.updateBalance", Date.now() - startTime);
    return result;
  }

  async updateStatus(id: string, status: InvestmentStatus) {
    const startTime = Date.now();
    const result = await this.db.investment.update({
      where: { id },
      data: { status },
    });
    this.logQueryDuration("InvestmentRepository.updateStatus", Date.now() - startTime);
    return result;
  }
}

export const investmentRepository = new InvestmentRepository();
export default investmentRepository;
