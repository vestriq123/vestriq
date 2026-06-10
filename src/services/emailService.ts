import fs from "fs";
import path from "path";

export interface EmailOptions {
  to: string;
  subject: string;
  bodyHtml: string;
}

export class EmailService {
  private emailsDir = process.env.VERCEL === "1"
    ? path.join("/tmp", "sent_emails")
    : path.join(process.cwd(), "sent_emails");

  constructor() {
    try {
      // Ensure the simulation folder exists
      if (!fs.existsSync(this.emailsDir)) {
        fs.mkdirSync(this.emailsDir, { recursive: true });
      }
    } catch (err) {
      console.warn("[Simulated Mailer] Failed to initialize emails directory:", err);
    }
  }

  async sendEmail(options: EmailOptions): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedEmail = options.to.replace(/[@.]/g, "_");
    const filename = `${timestamp}_to_${sanitizedEmail}.html`;
    const filePath = path.join(this.emailsDir, filename);

    // Frame with premium responsive template
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${options.subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #020617;
      color: #f8fafc;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid #1e293b;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 40px 30px;
      text-align: center;
      border-b: 1px solid #1e293b;
      background: linear-gradient(135deg, #4f46e5 0%, #10b981 100%);
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.05em;
      color: #ffffff;
    }
    .content {
      padding: 40px 30px;
      line-height: 1.6;
      font-size: 15px;
      color: #94a3b8;
    }
    .footer {
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #475569;
      border-top: 1px solid #1e293b;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
    .highlight {
      color: #f8fafc;
      font-weight: 600;
    }
    .btn {
      display: inline-block;
      padding: 12px 28px;
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Vestriq Wealth</h1>
    </div>
    <div class="content">
      ${options.bodyHtml}
    </div>
    <div class="footer">
      This is a transaction verification notification. If you did not authorize this activity, please contact support immediately.<br>
      © ${new Date().getFullYear()} Vestriq Ltd. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    try {
      if (!fs.existsSync(this.emailsDir)) {
        fs.mkdirSync(this.emailsDir, { recursive: true });
      }
      await fs.promises.writeFile(filePath, fullHtml, "utf8");
      console.log(`[Simulated Mailer] Email written to: ${filePath}`);
    } catch (err) {
      console.warn(`[Simulated Mailer] Could not write email to disk:`, err);
    }
    return filePath;
  }
}

export const emailService = new EmailService();
export default emailService;
