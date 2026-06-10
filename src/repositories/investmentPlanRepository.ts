import { BaseRepository } from "./baseRepository";

export class InvestmentPlanRepository extends BaseRepository {
  async findAll(onlyEnabled = true) {
    const startTime = Date.now();
    const where = onlyEnabled
      ? this.excludeDeleted({ enabled: true })
      : this.excludeDeleted({});
    
    const results = await this.db.investmentPlan.findMany({
      where,
      orderBy: { minAmount: "asc" },
    });
    this.logQueryDuration("InvestmentPlanRepository.findAll", Date.now() - startTime);
    return results;
  }

  async findById(id: string) {
    const startTime = Date.now();
    const result = await this.db.investmentPlan.findFirst({
      where: this.excludeDeleted({ id }),
    });
    this.logQueryDuration("InvestmentPlanRepository.findById", Date.now() - startTime);
    return result;
  }

  async findByName(name: string) {
    const startTime = Date.now();
    const result = await this.db.investmentPlan.findFirst({
      where: this.excludeDeleted({ name }),
    });
    this.logQueryDuration("InvestmentPlanRepository.findByName", Date.now() - startTime);
    return result;
  }

  async create(data: { name: string; description: string; minAmount: number; maxAmount: number }) {
    const startTime = Date.now();
    const result = await this.db.investmentPlan.create({
      data,
    });
    this.logQueryDuration("InvestmentPlanRepository.create", Date.now() - startTime);
    return result;
  }

  async update(
    id: string,
    data: Partial<{ name: string; description: string; minAmount: number; maxAmount: number; enabled: boolean }>
  ) {
    const startTime = Date.now();
    const result = await this.db.investmentPlan.update({
      where: { id },
      data,
    });
    this.logQueryDuration("InvestmentPlanRepository.update", Date.now() - startTime);
    return result;
  }

  async softDelete(id: string) {
    const startTime = Date.now();
    const result = await this.db.investmentPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.logQueryDuration("InvestmentPlanRepository.softDelete", Date.now() - startTime);
    return result;
  }
}

export const investmentPlanRepository = new InvestmentPlanRepository();
export default investmentPlanRepository;
