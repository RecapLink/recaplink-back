import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface ResetPasswordEmailOptions {
  to: string;
  fullName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT') ?? 587,
      secure: (this.config.get<number>('MAIL_PORT') ?? 587) === 465,
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendResetPasswordEmail(opts: ResetPasswordEmailOptions): Promise<void> {
    const { to, fullName, resetUrl, expiresInMinutes } = opts;
    const from = this.config.get<string>('MAIL_FROM') ?? 'noreply@recap.tn';

    const html = this.buildResetEmailHtml({ fullName, resetUrl, expiresInMinutes });
    const text = this.buildResetEmailText({ fullName, resetUrl, expiresInMinutes });

    try {
      await this.transporter.sendMail({
        from: `RecapLink <${from}>`,
        to,
        subject: 'Réinitialisation de votre mot de passe RecapLink',
        html,
        text,
      });
      this.logger.log(`Reset password email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send reset email to ${to}: ${(err as Error).message}`);
      // Rethrow so caller can decide to still return 200 for security
      throw err;
    }
  }

  async sendNotificationEmail(opts: { to: string; fullName: string; title: string; message: string; link?: string }): Promise<void> {
    const { to, fullName, title, message, link } = opts;
    const from = this.config.get<string>('MAIL_FROM') ?? 'noreply@recap.tn';
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const url = link ? `${frontendUrl}${link}` : frontendUrl;

    try {
      await this.transporter.sendMail({
        from: `RecapLink <${from}>`,
        to,
        subject: title,
        html: `<p>Bonjour ${fullName},</p><p>${message}</p><p><a href="${url}">Voir sur RecapLink</a></p>`,
        text: `Bonjour ${fullName},\n\n${message}\n\n${url}`,
      });
    } catch (err) {
      this.logger.error(`Failed to send notification email to ${to}: ${(err as Error).message}`);
    }
  }

  private buildResetEmailHtml(opts: { fullName: string; resetUrl: string; expiresInMinutes: number }): string {
    const { fullName, resetUrl, expiresInMinutes } = opts;
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Réinitialisation de mot de passe</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f4; font-family: Inter, Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    .header { background: #4d9538; padding: 32px 40px; text-align: center; }
    .header img { height: 48px; }
    .body { padding: 40px; }
    .body h1 { font-size: 24px; font-weight: 700; color: #231f20; margin: 0 0 12px; }
    .body p { font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 20px; }
    .btn { display: inline-block; background: #4d9538; color: #fff !important; text-decoration: none; font-size: 18px; font-weight: 700; padding: 16px 40px; border-radius: 30px; }
    .btn-wrap { text-align: center; margin: 32px 0; }
    .url { word-break: break-all; font-size: 13px; color: #888; }
    .footer { background: #f9f9f9; padding: 24px 40px; text-align: center; font-size: 13px; color: #aaa; border-top: 1px solid #eee; }
    .expiry { background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 12px 16px; font-size: 14px; color: #795548; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span style="color:#fff;font-size:28px;font-weight:800;letter-spacing:-1px;">RecapLink</span>
    </div>
    <div class="body">
      <h1>Bonjour ${fullName},</h1>
      <p>Vous avez demandé la réinitialisation de votre mot de passe RecapLink. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
      <div class="btn-wrap">
        <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe</a>
      </div>
      <div class="expiry">
        ⏱ Ce lien est valable pendant <strong>${expiresInMinutes} minutes</strong> à partir de maintenant.
      </div>
      <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
      <p class="url"><a href="${resetUrl}" style="color:#4d9538;">${resetUrl}</a></p>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email — votre mot de passe restera inchangé.</p>
    </div>
    <div class="footer">
      © 2026 RecapLink — Développé par <a href="https://ufuk.tn" style="color:#4d9538;">UFUK CONNECT</a>
    </div>
  </div>
</body>
</html>`;
  }

  private buildResetEmailText(opts: { fullName: string; resetUrl: string; expiresInMinutes: number }): string {
    const { fullName, resetUrl, expiresInMinutes } = opts;
    return `Bonjour ${fullName},

Vous avez demandé la réinitialisation de votre mot de passe RecapLink.

Cliquez sur ce lien pour choisir un nouveau mot de passe (valable ${expiresInMinutes} minutes) :
${resetUrl}

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

— L'équipe RecapLink`;
  }
}
