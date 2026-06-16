import { db } from "@/lib/db";
import { emailService } from "./emailService";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

type DbClient = typeof db | Omit<typeof db, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export class NotificationService {
  private getClient(tx?: DbClient): DbClient {
    return tx || db;
  }

  private formatAmount(amount: number): string {
    return Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async sendDepositApproved(userId: string, amount: number, planName: string, tx?: DbClient) {
    const client = this.getClient(tx);
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true }
    });

    if (!user) return;

    const title = "Deposit Approved";
    const message = `Your deposit of $${this.formatAmount(amount)} for the ${planName} plan has been verified and is now active.`;

    // 1. Create In-App Notification
    await client.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    // 2. Send Email
    const bodyHtml = `
      <p>Hello <span class="highlight">${user.username}</span>,</p>
      <p>We are pleased to inform you that your deposit has been verified successfully.</p>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #1e293b; padding: 20px; border-radius: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #475569; padding: 6px 0;">Investment Plan</td>
            <td style="color: #f8fafc; font-weight: 600; text-align: right; padding: 6px 0;">${planName}</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 6px 0;">Deposited Amount</td>
            <td style="color: #10b981; font-weight: 700; text-align: right; padding: 6px 0; font-size: 16px;">+$${this.formatAmount(amount)}</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 6px 0;">Status</td>
            <td style="color: #10b981; font-weight: 600; text-align: right; padding: 6px 0;">ACTIVE</td>
          </tr>
        </table>
      </div>
      <p>Your subscription is now generating returns according to the plan terms. You can track your performance logs at any time on your dashboard.</p>
      <a href="${APP_URL}/dashboard" class="btn">View Portfolio Dashboard</a>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: `[Deposit Approved] $${this.formatAmount(amount)} Verified`,
      bodyHtml,
    });
  }

  async sendWithdrawalApproved(userId: string, amount: number, address: string, tx?: DbClient) {
    const client = this.getClient(tx);
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true }
    });

    if (!user) return;

    const title = "Withdrawal Approved";
    const message = `Your withdrawal request of $${this.formatAmount(amount)} has been processed and sent to your wallet address.`;

    // 1. Create In-App Notification
    await client.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    // 2. Send Email
    const bodyHtml = `
      <p>Hello <span class="highlight">${user.username}</span>,</p>
      <p>Your withdrawal request has been approved and successfully processed by our compliance team.</p>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #1e293b; padding: 20px; border-radius: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #475569; padding: 6px 0;">Payout Amount</td>
            <td style="color: #ef4444; font-weight: 700; text-align: right; padding: 6px 0; font-size: 16px;">-$${this.formatAmount(amount)}</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 6px 0;">Destination Network Address</td>
            <td style="color: #f8fafc; font-family: monospace; text-align: right; padding: 6px 0; word-break: break-all; max-width: 250px;">${address}</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 6px 0;">Status</td>
            <td style="color: #10b981; font-weight: 600; text-align: right; padding: 6px 0;">DISBURSED</td>
          </tr>
        </table>
      </div>
      <p>Funds generally complete blockchain confirmations within a few minutes. Please audit your external wallet balances shortly.</p>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: `[Withdrawal Disbursed] $${this.formatAmount(amount)} Approved`,
      bodyHtml,
    });
  }

  async sendPortfolioUpdated(
    userId: string,
    amount: number,
    nextBalance: number,
    type: "PROFIT" | "LOSS" | "ADJUSTMENT",
    note?: string,
    tx?: DbClient
  ) {
    const client = this.getClient(tx);
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true }
    });

    if (!user) return;

    const isPositive = amount >= 0;
    const sign = isPositive ? "+" : "-";
    const deltaColor = isPositive ? "#10b981" : "#ef4444";
    const title = type === "PROFIT" ? "Portfolio Earnings Applied" : "Portfolio Adjustment Applied";
    const message = `Your portfolio received a ${type.toLowerCase()} update of ${sign}$${this.formatAmount(amount)}. New balance: $${this.formatAmount(nextBalance)}.`;

    // 1. Create In-App Notification
    await client.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    // 2. Send Email
    const bodyHtml = `
      <p>Hello <span class="highlight">${user.username}</span>,</p>
      <p>A new performance adjust block has been recorded for your investment package.</p>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #1e293b; padding: 20px; border-radius: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #475569; padding: 6px 0;">Type</td>
            <td style="color: #f8fafc; font-weight: 600; text-align: right; padding: 6px 0;">${type}</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 6px 0;">Adjustment</td>
            <td style="color: ${deltaColor}; font-weight: 700; text-align: right; padding: 6px 0; font-size: 16px;">${sign}$${this.formatAmount(amount)}</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 6px 0;">Dynamic Valuation Balance</td>
            <td style="color: #f8fafc; font-weight: 700; text-align: right; padding: 6px 0;">$${this.formatAmount(nextBalance)}</td>
          </tr>
          ${note ? `
          <tr>
            <td style="color: #475569; padding: 6px 0; vertical-align: top;">Notes</td>
            <td style="color: #94a3b8; text-align: right; padding: 6px 0; font-style: italic;">${note}</td>
          </tr>
          ` : ""}
        </table>
      </div>
      <p>You can check complete performance records and metrics history directly from your dashboard analytics feed.</p>
      <a href="${APP_URL}/dashboard" class="btn">Audit Performance Logs</a>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: `[Portfolio Update] ${title} (${sign}$${this.formatAmount(amount)})`,
      bodyHtml,
    });
  }

  async sendBonusAdded(userId: string, amount: number, nextBalance: number, note?: string, tx?: DbClient) {
    const client = this.getClient(tx);
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true }
    });

    if (!user) return;

    const title = "Investment Bonus Applied";
    const message = `A bonus of +$${this.formatAmount(amount)} has been successfully credited to your investment. New balance: $${this.formatAmount(nextBalance)}.`;

    // 1. Create In-App Notification
    await client.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    // 2. Send Email
    const bodyHtml = `
      <p>Hello <span class="highlight">${user.username}</span>,</p>
      <p>Congratulations! A rewards bonus has been applied directly to your dynamic active investment holding balance.</p>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #1e293b; padding: 20px; border-radius: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #475569; padding: 6px 0;">Rewards Bonus Value</td>
            <td style="color: #10b981; font-weight: 700; text-align: right; padding: 6px 0; font-size: 16px;">+$${this.formatAmount(amount)}</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 6px 0;">Dynamic Valuation Balance</td>
            <td style="color: #f8fafc; font-weight: 700; text-align: right; padding: 6px 0;">$${this.formatAmount(nextBalance)}</td>
          </tr>
          ${note ? `
          <tr>
            <td style="color: #475569; padding: 6px 0; vertical-align: top;">Campaign / Event Info</td>
            <td style="color: #94a3b8; text-align: right; padding: 6px 0; font-style: italic;">${note}</td>
          </tr>
          ` : ""}
        </table>
      </div>
      <p>Thank you for choosing Vestriq as your wealth optimization platform.</p>
      <a href="${APP_URL}/dashboard" class="btn">View User Portal</a>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: `[Bonus Credited] +$${this.formatAmount(amount)} Reward Applied`,
      bodyHtml,
    });
  }

  async sendRegistrationConfirmation(userId: string, tx?: DbClient) {
    const client = this.getClient(tx);
    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        verificationStatus: true,
        profile: {
          select: {
            fullName: true
          }
        }
      }
    });

    if (!user) return;

    const isApproved = user.verificationStatus === "APPROVED";
    const title = isApproved ? "Welcome to Vestriq!" : "Account Registration Pending Verification";
    const message = isApproved 
      ? "Your registration was successful. Welcome to your next-gen wealth management terminal."
      : "Your registration was successful. Please await admin verification of your uploaded ID document.";

    // 1. Create In-App Notification
    await client.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    // 2. Send Email
    const displayName = user.profile?.fullName || user.username;
    const statusText = isApproved ? "Verified & Active" : "Awaiting ID Verification";
    const statusColor = isApproved ? "#10b981" : "#eab308";
    
    const bodyHtml = `
      <p>Hello <span class="highlight">${displayName}</span>,</p>
      <p>${isApproved 
        ? "Thank you for registering your investor account with <strong>Vestriq</strong>. Your next-generation wealth management terminal is now fully active."
        : "Thank you for registering your investor account with <strong>Vestriq</strong>. To safeguard investor allocations, all profiles require administrative document verification before trading services are unlocked."}</p>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #1e293b; padding: 25px; border-radius: 16px; margin: 25px 0;">
        <h3 style="color: #f8fafc; margin-top: 0; font-size: 16px; border-bottom: 1px solid #1e293b; padding-bottom: 10px;">Account Registration Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #475569; padding: 8px 0;">Username</td>
            <td style="color: #f8fafc; font-weight: 600; text-align: right; padding: 8px 0;">${user.username}</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 8px 0;">Registered Email</td>
            <td style="color: #f8fafc; font-weight: 600; text-align: right; padding: 8px 0;">${user.email}</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 8px 0;">Status</td>
            <td style="color: ${statusColor}; font-weight: 750; text-align: right; padding: 8px 0; font-size: 13px; text-transform: uppercase;">${statusText}</td>
          </tr>
        </table>
      </div>
      ${isApproved ? `
      <p>To begin optimizing your capital allocations:</p>
      <ol style="padding-left: 20px; color: #94a3b8; font-size: 14px; line-height: 1.8;">
        <li>Log in to your private investor dashboard.</li>
        <li>Browse our curated, active-manager Investment Plans.</li>
        <li>Transmit crypto funds to secure your designated investment slot.</li>
      </ol>
      <a href="${APP_URL}/dashboard" class="btn">Access Dashboard Terminal</a>
      ` : `
      <p><strong>Next Steps:</strong> Our compliance team is currently reviewing your uploaded ID credentials and SSN. You will receive an email notification as soon as your account has been verified and approved.</p>
      <a href="${APP_URL}/login" class="btn">Monitor Approval Status</a>
      `}
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: isApproved ? "Welcome to Vestriq - Registration Confirmed" : "Vestriq - Verification Pending Review",
      bodyHtml,
    });
  }

  async sendUserApproved(userId: string, tx?: DbClient) {
    const client = this.getClient(tx);
    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        profile: {
          select: {
            fullName: true
          }
        }
      }
    });

    if (!user) return;

    const title = "Account Verified & Approved!";
    const message = "Congratulations! Your identity document has been verified. Your investor portal is now fully active.";

    await client.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    const displayName = user.profile?.fullName || user.username;
    const bodyHtml = `
      <p>Hello <span class="highlight">${displayName}</span>,</p>
      <p>We are excited to inform you that your identity documents and investor registration have been successfully verified and approved by our security compliance desk.</p>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #1e293b; padding: 25px; border-radius: 16px; margin: 25px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #475569; padding: 8px 0;">Account Status</td>
            <td style="color: #10b981; font-weight: 750; text-align: right; padding: 8px 0; font-size: 13px; text-transform: uppercase;">ACTIVE / VERIFIED</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 8px 0;">Unlocked Capabilities</td>
            <td style="color: #f8fafc; font-weight: 600; text-align: right; padding: 8px 0;">Deposit, Investment Plans, Payouts</td>
          </tr>
        </table>
      </div>
      <p>Your access block has been removed. You can now fund your wallet, subscribe to investment structures, and start generating premium yields.</p>
      <a href="${APP_URL}/dashboard" class="btn">Launch Dashboard Terminal</a>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: "[Vestriq] Account Approved & Verification Success",
      bodyHtml,
    });
  }

  async sendUserRejected(userId: string, reason?: string, tx?: DbClient) {
    const client = this.getClient(tx);
    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        profile: {
          select: {
            fullName: true
          }
        }
      }
    });

    if (!user) return;

    const title = "Account Verification Rejected";
    const message = `Your document verification was rejected. Reason: ${reason || "Provided documents do not meet verification criteria."}`;

    await client.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    const displayName = user.profile?.fullName || user.username;
    const bodyHtml = `
      <p>Hello <span class="highlight">${displayName}</span>,</p>
      <p>We regret to inform you that your investor registration and identity verification request was not approved during our manual document audit.</p>
      <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 25px; border-radius: 16px; margin: 25px 0;">
        <h4 style="color: #ef4444; margin-top: 0; font-size: 14px; font-weight: 700;">Reason for Rejection:</h4>
        <p style="color: #f8fafc; font-size: 13px; line-height: 1.6; margin-bottom: 0;">${reason || "The uploaded ID document image was unclear, invalid, or expired. Please upload a clear photo of your government-issued ID card or driver's license."}</p>
      </div>
      <p>Please log in to review your profile details or contact support for help with document verification.</p>
      <a href="${APP_URL}/login" class="btn">View Account Profile</a>
    `;    await emailService.sendEmail({
      to: user.email,
      subject: "[Vestriq] Verification Rejected - Action Required",
      bodyHtml,
    });
  }

  async sendPlanUpgraded(userId: string, oldPlanName: string, newPlanName: string, tx?: DbClient) {
    const client = this.getClient(tx);
    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        profile: {
          select: {
            fullName: true
          }
        }
      }
    });

    if (!user) return;

    const title = "Investment Plan Upgraded";
    const message = `Successfully upgraded your investment plan from ${oldPlanName} to ${newPlanName}.`;

    await client.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });

    const displayName = user.profile?.fullName || user.username;
    const bodyHtml = `
      <p>Hello <span class="highlight">${displayName}</span>,</p>
      <p>Your investment plan upgrade has been processed successfully.</p>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #1e293b; padding: 20px; border-radius: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #475569; padding: 6px 0;">Previous Plan</td>
            <td style="color: #94a3b8; text-decoration: line-through; text-align: right; padding: 6px 0;">${oldPlanName}</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 6px 0;">New Active Plan</td>
            <td style="color: #10b981; font-weight: 700; text-align: right; padding: 6px 0; font-size: 15px;">${newPlanName}</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 6px 0;">Status</td>
            <td style="color: #10b981; font-weight: 600; text-align: right; padding: 6px 0;">ACTIVE</td>
          </tr>
        </table>
      </div>
      <p>Your returns will now scale based on the guidelines of your upgraded plan.</p>
      <a href="${APP_URL}/dashboard" class="btn">View Portfolio Dashboard</a>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: `[Plan Upgraded] Transition to ${newPlanName} Successful`,
      bodyHtml,
    });
  }
}
export const notificationService = new NotificationService();
export default notificationService;
