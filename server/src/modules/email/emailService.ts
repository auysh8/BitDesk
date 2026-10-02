import nodemailer, { type Transporter } from "nodemailer";
import appConfig from "../../config/config.js";
import EmailEvent from "./emailEvent.model.js";
import {
  renderTicketCreatedEmail,
  renderTicketReplyEmail,
  renderStatusChangedEmail,
} from "./emailTemplate.js";

let transporter: Transporter | null = null;

/**
 * Initializes or retrieves the Nodemailer transporter.
 * Falls back to an automatic Ethereal test account if no SMTP credentials are configured.
 */
const getTransporter = async (): Promise<Transporter> => {
  if (transporter) return transporter;

  if (appConfig.SMTP_USER && appConfig.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: appConfig.SMTP_HOST,
      port: appConfig.SMTP_PORT,
      secure: appConfig.SMTP_PORT === 465,
      auth: {
        user: appConfig.SMTP_USER,
        pass: appConfig.SMTP_PASS,
      },
    });
    console.log(
      `[Email Service] Configured live SMTP transport with host: ${appConfig.SMTP_HOST}`,
    );
  } else {
    // Generate a temporary Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(
      `[Email Service] Using Ethereal Mail test inbox: ${testAccount.user}`,
    );
  }

  return transporter;
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  ticketNumber: string;
  ticketId?: any;
}

/**
 * Sends an email asynchronously with full email threading headers.
 * Does NOT block the caller.
 */
export const sendTicketEmail = async (
  options: SendEmailOptions,
): Promise<void> => {
  const { to, subject, html, ticketNumber, ticketId } = options;

  // RFC Standard Threading Identifiers
  const messageId = `<ticket-${ticketNumber}-${Date.now()}@bitdesk.local>`;
  const threadReference = `<ticket-${ticketNumber}@bitdesk.local>`;
  const replyToAddress = `BitDesk Support <reply+${ticketNumber}@bitdesk.local>`;

  // Asynchronous background execution (doesn't block the HTTP request)
  setImmediate(async () => {
    try {
      const activeTransporter = await getTransporter();

      const mailOptions = {
        from:
          appConfig.EMAIL_FROM || '"BitDesk Support" <support@bitdesk.local>',
        to,
        subject: `[${ticketNumber}] ${subject}`,
        html,
        messageId,
        inReplyTo: threadReference,
        references: threadReference,
        replyTo: replyToAddress,
        headers: {
          "X-BitDesk-Ticket-Number": ticketNumber,
          "X-BitDesk-Ticket-Id": ticketId ? ticketId.toString() : "",
        },
      };

      const info = await activeTransporter.sendMail(mailOptions);

      // If in development using Ethereal, log the web preview URL!
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`\n========================================`);
        console.log(`[EMAIL DISPATCHED] To: ${to}`);
        console.log(`[EMAIL SUBJECT] [${ticketNumber}] ${subject}`);
        console.log(`[VIEW EMAIL IN BROWSER]: ${previewUrl}`);
        console.log(`========================================\n`);
      } else {
        console.log(`[EMAIL DISPATCHED] [${ticketNumber}] to ${to}`);
      }

      // Record successful delivery event
      await EmailEvent.create({
        providerMessageId: info.messageId,
        messageId,
        ticketId: ticketId || null,
        ticketNumber,
        recipientEmail: to,
        direction: "outbound",
        subject: `[${ticketNumber}] ${subject}`,
        status: "sent",
        processedAt: new Date(),
      });
    } catch (err: any) {
      console.error(
        `[Email Service] Failed to send email for ${ticketNumber}:`,
        err.message,
      );

      // Record failed event in audit logs
      await EmailEvent.create({
        messageId,
        ticketId: ticketId || null,
        ticketNumber,
        recipientEmail: to,
        direction: "outbound",
        subject: `[${ticketNumber}] ${subject}`,
        status: "failed",
        error: err.message,
        processedAt: new Date(),
      }).catch(() => {});
    }
  });
};

// Convenient helper dispatchers:
export const notifyTicketCreated = (ticket: any, requesterName: string) => {
  sendTicketEmail({
    to: ticket.requesterEmail,
    subject: ticket.subject,
    html: renderTicketCreatedEmail(
      ticket.ticketNumber,
      ticket.subject,
      requesterName,
      ticket.description,
    ),
    ticketNumber: ticket.ticketNumber,
    ticketId: ticket._id,
  });
};

export const notifyTicketReply = (
  ticket: any,
  recipientEmail: string,
  senderName: string,
  replyBody: string,
) => {
  sendTicketEmail({
    to: recipientEmail,
    subject: ticket.subject,
    html: renderTicketReplyEmail(
      ticket.ticketNumber,
      ticket.subject,
      senderName,
      replyBody,
    ),
    ticketNumber: ticket.ticketNumber,
    ticketId: ticket._id,
  });
};

export const notifyStatusChanged = (
  ticket: any,
  recipientEmail: string,
  oldStatus: string,
  newStatus: string,
) => {
  sendTicketEmail({
    to: recipientEmail,
    subject: ticket.subject,
    html: renderStatusChangedEmail(
      ticket.ticketNumber,
      ticket.subject,
      oldStatus,
      newStatus,
    ),
    ticketNumber: ticket.ticketNumber,
    ticketId: ticket._id,
  });
};
