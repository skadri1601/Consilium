import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromAddress =
      process.env.RESEND_FROM_ADDRESS || "Saad at Consilium <saad@myconsilium.xyz>";

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
      this.logger.warn("RESEND_API_KEY not set, email sending disabled");
    }
  }

  async sendWelcomeEmail(
    to: string,
    firstName: string,
  ): Promise<{ success: boolean }> {
    if (!this.resend) {
      this.logger.debug("Email service not configured, skipping welcome email");
      return { success: false };
    }

    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: "Welcome to Consilium — glad you're here",
        html: this.buildWelcomeHtml(firstName),
      });

      this.logger.log(`Welcome email sent to ${to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${to}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return { success: false };
    }
  }

  private buildWelcomeHtml(firstName: string): string {
    const name = firstName || "there";
    const appUrl = process.env.APP_URL || "https://myconsilium.xyz";

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:48px;border:1px solid #e5e7eb">
<tr><td>
<p style="margin:0 0 32px;font-size:22px;font-weight:600;color:#111827;letter-spacing:-0.3px">Consilium</p>
<p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6">Hi ${name},</p>
<p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6">Thank you for creating an account and giving Consilium a chance. We hope you enjoy all the features — please don't hesitate to reach out if you have any questions, and we're always happy to take feedback.</p>
<p style="margin:0 0 32px;font-size:16px;color:#374151;line-height:1.6">Jump in whenever you're ready:</p>
<a href="${appUrl}/council" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;letter-spacing:0.1px">Open Consilium</a>
<p style="margin:40px 0 8px;font-size:14px;color:#374151;line-height:1.6">— Saad</p>
<p style="margin:0;font-size:13px;color:#9ca3af">Founder, Consilium &middot; <a href="mailto:saad@myconsilium.xyz" style="color:#6b7280;text-decoration:none">saad@myconsilium.xyz</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }
}
