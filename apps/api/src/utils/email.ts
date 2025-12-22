import Mailgun from 'mailgun.js';
import FormData from 'form-data';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    data: Buffer | string;
    contentType?: string;
  }>;
  template?: string;
  variables?: Record<string, any>;
}

interface EmailConfig {
  apiKey: string;
  domain: string;
  from: string;
  enabled: boolean;
}

export class EmailService {
  private mailgun: any;
  private config: EmailConfig;

  constructor() {
    this.config = {
      apiKey: process.env.MAILGUN_API_KEY || '',
      domain: process.env.MAILGUN_DOMAIN || '',
      from: process.env.MAILGUN_FROM_EMAIL || 'noreply@innozverse.com',
      enabled: process.env.MAILGUN_ENABLED === 'true',
    };

    if (this.config.enabled) {
      if (!this.config.apiKey || !this.config.domain) {
        console.warn('Mailgun API key or domain not configured. Email sending will be disabled.');
        this.config.enabled = false;
      } else {
        const mg = new Mailgun(FormData);
        this.mailgun = mg.client({
          username: 'api',
          key: this.config.apiKey,
        });
      }
    }
  }

  async send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config.enabled) {
      console.log('Email sending is disabled. Email that would be sent:', {
        to: options.to,
        subject: options.subject,
      });
      return { success: false, error: 'Email sending is disabled' };
    }

    try {
      const messageData: any = {
        from: options.from || this.config.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
      };

      if (options.html) messageData.html = options.html;
      if (options.text) messageData.text = options.text;
      if (options.cc) messageData.cc = Array.isArray(options.cc) ? options.cc.join(', ') : options.cc;
      if (options.bcc) messageData.bcc = Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc;

      if (options.template) {
        messageData.template = options.template;
        if (options.variables) {
          messageData['h:X-Mailgun-Variables'] = JSON.stringify(options.variables);
        }
      }

      if (options.attachments && options.attachments.length > 0) {
        messageData.attachment = options.attachments.map((att) => ({
          filename: att.filename,
          data: att.data,
          contentType: att.contentType,
        }));
      }

      const response = await this.mailgun.messages.create(this.config.domain, messageData);
      return { success: true, messageId: response.id };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendInvitation(options: { to: string; name: string; inviteUrl: string; inviterName?: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
.content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
.button { display: inline-block; background: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
.footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
</style></head><body><div class="container">
<div class="header"><h1>You're Invited to Innozverse!</h1></div>
<div class="content"><h2>Hello ${options.name}!</h2>
<p>${options.inviterName ? `${options.inviterName} has invited you to join Innozverse.` : 'You have been invited to join Innozverse.'}</p>
<p>Click the button below to accept your invitation and set up your account:</p>
<p style="text-align: center;"><a href="${options.inviteUrl}" class="button">Accept Invitation</a></p>
<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">${options.inviteUrl}</p>
<p><strong>Note:</strong> This invitation link will expire in 7 days.</p>
</div><div class="footer"><p>© ${new Date().getFullYear()} Innozverse. All rights reserved.</p>
</div></div></body></html>`;

    const text = `Hello ${options.name}!

${options.inviterName ? `${options.inviterName} has invited you to join Innozverse.` : 'You have been invited to join Innozverse.'}

Click the link below to accept your invitation and set up your account:
${options.inviteUrl}

Note: This invitation link will expire in 7 days.

© ${new Date().getFullYear()} Innozverse. All rights reserved.`;

    return this.send({ to: options.to, subject: "You're invited to Innozverse", html, text });
  }

  async sendWelcome(options: { to: string; name: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = '<h1>Welcome!</h1>';
    const text = 'Welcome!';
    return this.send({ to: options.to, subject: 'Welcome to Innozverse', html, text });
  }

  async sendPasswordReset(options: { to: string; name: string; resetUrl: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
.content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
.button { display: inline-block; background: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
.warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
.footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
</style></head><body><div class="container">
<div class="header"><h1>Password Reset Request</h1></div>
<div class="content"><h2>Hello ${options.name}!</h2>
<p>We received a request to reset your password for your Innozverse account.</p>
<p>Click the button below to reset your password:</p>
<p style="text-align: center;"><a href="${options.resetUrl}" class="button">Reset Password</a></p>
<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">${options.resetUrl}</p>
<div class="warning">
<p><strong>Security Notice:</strong></p>
<ul>
<li>This link will expire in 1 hour</li>
<li>If you didn't request this reset, please ignore this email</li>
<li>Your password will not change unless you click the link above</li>
</ul>
</div>
</div><div class="footer"><p>© ${new Date().getFullYear()} Innozverse. All rights reserved.</p>
</div></div></body></html>`;

    const text = `Hello ${options.name}!

We received a request to reset your password for your Innozverse account.

Click the link below to reset your password:
${options.resetUrl}

Security Notice:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Your password will not change unless you click the link above

© ${new Date().getFullYear()} Innozverse. All rights reserved.`;

    return this.send({ to: options.to, subject: 'Reset Your Innozverse Password', html, text });
  }
}

export const emailService = new EmailService();

// Helper function to normalize email addresses
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}
