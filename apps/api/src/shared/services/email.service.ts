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
      process.env.RESEND_FROM_ADDRESS || "Consilium <welcome@consilium.dev>";

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
        subject: "Welcome to Consilium",
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
    const appUrl = process.env.APP_URL || "https://consilium.dev";

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;padding:48px;border:1px solid #e5e7eb">
<tr><td>
<h1 style="margin:0 0 24px;font-size:24px;color:#111827">Welcome to Consilium</h1>
<p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6">Hi ${name},</p>
<p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6">Your account is ready. Start building AI-powered council debates and explore what Consilium can do for you.</p>
<a href="${appUrl}/dashboard" style="display:inline-block;background:#111827;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">Get Started</a>
<p style="margin:32px 0 0;font-size:13px;color:#9ca3af">Consilium</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }
}
