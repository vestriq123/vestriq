export type UserRole = "USER" | "ADMIN";

export interface UserSession {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
}

export type InvestmentPlanStatus = "ACTIVE" | "INACTIVE";

export type DepositStatus = "PENDING" | "APPROVED" | "REJECTED";

export type WithdrawalStatus = "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";
