import { NextResponse } from "next/server";
import { emailService } from "@/services/emailService";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(1, "Message is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, message } = result.data;

    // Construct the email body
    const bodyHtml = `
      <p>Hello Support Team,</p>
      <p>You have received a new message from the Vestriq homepage contact form:</p>
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid #1e293b; padding: 20px; border-radius: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #475569; padding: 6px 0; width: 100px;">Sender Name</td>
            <td style="color: #f8fafc; font-weight: 600; padding: 6px 0;">${name}</td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 6px 0;">Sender Email</td>
            <td style="color: #f8fafc; font-weight: 600; padding: 6px 0;"><a href="mailto:${email}" style="color: #6366f1; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td style="color: #475569; padding: 6px 0; vertical-align: top;">Message</td>
            <td style="color: #94a3b8; padding: 6px 0; white-space: pre-wrap; line-height: 1.5;">${message}</td>
          </tr>
        </table>
      </div>
      <p>Please reply to the inquirer directly at <a href="mailto:${email}" style="color: #6366f1; text-decoration: none;">${email}</a>.</p>
    `;

    // Send the email to the designated address
    await emailService.sendEmail({
      to: "admin@vestriqinvest.com",
      subject: `[Contact Form Inquiry] ${name}`,
      bodyHtml,
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Contact form submission error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
