import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import appConfig from "../../config/config.js";
import EmailEvent from "./emailEvent.model.js";
import User from "../user/userModel.js";
import { USER_ROLES } from "../../constants/roles.js";
import {
  renderTicketCreatedEmail,
  renderAdminNewTicketAlert,
  renderTicketReplyEmail,
  renderStatusChangedEmail,
  renderTicketAssignedEmail,
  renderOtpEmail,
} from "./emailTemplate.js";

let transporter: Transporter | null = null;
let resendClient: Resend | null = null;

const getResendClient = (): Resend | null => {
  if (appConfig.RESEND_API_KEY) {
    if (!resendClient) {
      resendClient = new Resend(appConfig.RESEND_API_KEY.trim());
    }
    return resendClient;
  }
  return null;
};

/**
 * Initializes or retrieves the Nodemailer transporter for SMTP fallback.
 * Falls back to an automatic Ethereal test account if no SMTP credentials are configured.
 */
const getTransporter = async (): Promise<Transporter> => {
  if (transporter) return transporter;

  const smtpUser = appConfig.SMTP_USER?.trim();
  const smtpPass = appConfig.SMTP_PASS?.replace(/\s+/g, "");

  if (smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: appConfig.SMTP_HOST,
      port: appConfig.SMTP_PORT,
      secure: appConfig.SMTP_PORT === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
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
 * Priority order:
 * 1. Resend API (HTTPS Port 443 - Works seamlessly on Render/Vercel)
 * 2. Brevo API (HTTPS Port 443)
 * 3. Nodemailer SMTP (Port 587/465)
 */
export const sendTicketEmail = async (
  options: SendEmailOptions,
): Promise<void> => {
  const { to, subject, html, ticketNumber, ticketId } = options;

  if (to.endsWith("@bitdesk.dev") || to.endsWith("@bitdesk.local")) {
    // Avoid bouncebacks for fictional demo domains
    return;
  }

  const fromEmailMatch = (appConfig.EMAIL_FROM || "").match(/<([^>]+)>/) || [
    null,
    (appConfig.EMAIL_FROM || "").trim(),
  ];
  const fromEmail =
    fromEmailMatch[1] || appConfig.SMTP_USER || "support@bitdesk.local";
  const [userPrefix, domain] = fromEmail.includes("@")
    ? fromEmail.split("@")
    : ["support", "bitdesk.local"];

  // RFC Standard Threading Identifiers dynamically using active domain
  const messageId = `<ticket-${ticketNumber}-${Date.now()}@${domain}>`;
  const threadReference = `<ticket-${ticketNumber}@${domain}>`;
  const replyToAddress = `BitDesk Support <${userPrefix}+${ticketNumber}@${domain}>`;

  // Asynchronous background execution (doesn't block the HTTP request)
  setImmediate(async () => {
    try {
      let providerMessageId: string | undefined;
      const resend = getResendClient();

      // 1. Check if Google Apps Script Gmail Relay is configured (bypasses domain restrictions & SMTP port blocks)
      if (appConfig.GMAIL_RELAY_URL) {
        const relayRes = await fetch(appConfig.GMAIL_RELAY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to,
            subject: `[${ticketNumber}] ${subject}`,
            html,
            senderName: "BitDesk Support",
            replyTo: replyToAddress,
          }),
        });

        const relayJson: any = await relayRes.json().catch(() => null);
        if (relayJson && relayJson.error) {
          throw new Error(`Gmail Relay Error: ${relayJson.error}`);
        }
        providerMessageId = `gmail-relay-${Date.now()}`;
        console.log(
          `[Email Service - Gmail Relay] [${ticketNumber}] Dispatched to ${to}`,
        );
      }
      // 2. Check if Resend HTTP API is configured
      else if (resend) {
        // Resend requires a verified domain to send from custom addresses.
        // For public mailboxes (@gmail.com, @yahoo, etc.) or demo domains, fall back to onboarding@resend.dev
        let fromSender = "BitDesk Support <onboarding@resend.dev>";
        if (
          appConfig.EMAIL_FROM &&
          !appConfig.EMAIL_FROM.includes("@gmail.com") &&
          !appConfig.EMAIL_FROM.includes("@yahoo.") &&
          !appConfig.EMAIL_FROM.includes("@hotmail.") &&
          !appConfig.EMAIL_FROM.includes("@outlook.") &&
          !appConfig.EMAIL_FROM.includes("@bitdesk.local")
        ) {
          fromSender = appConfig.EMAIL_FROM;
        }

        const { data, error } = await resend.emails.send({
          from: fromSender,
          to: [to],
          subject: `[${ticketNumber}] ${subject}`,
          html,
          replyTo: replyToAddress,
          headers: {
            "X-BitDesk-Ticket-Number": ticketNumber,
            "X-BitDesk-Ticket-Id": ticketId ? ticketId.toString() : "",
            "In-Reply-To": threadReference,
            References: threadReference,
          },
        });

        if (error) {
          throw new Error(`Resend Error: ${error.message}`);
        }
        providerMessageId = data?.id;
        console.log(
          `[Email Service - Resend] [${ticketNumber}] Dispatched to ${to} (ID: ${providerMessageId})`,
        );
      }
      // 2. Check if Brevo HTTP API is configured
      else if (appConfig.BREVO_API_KEY) {
        const replyEmailOnly =
          replyToAddress.match(/<([^>]+)>/)?.[1] || fromEmail;
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": appConfig.BREVO_API_KEY.trim(),
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            sender: { name: "BitDesk Support", email: fromEmail },
            to: [{ email: to }],
            replyTo: { email: replyEmailOnly, name: "BitDesk Support" },
            subject: `[${ticketNumber}] ${subject}`,
            htmlContent: html,
            headers: {
              "X-BitDesk-Ticket-Number": ticketNumber,
              "In-Reply-To": threadReference,
              References: threadReference,
            },
          }),
        });

        const brevoJson: any = await res.json();
        if (!res.ok) {
          throw new Error(
            `Brevo Error: ${brevoJson.message || JSON.stringify(brevoJson)}`,
          );
        }
        providerMessageId = brevoJson.messageId;
        console.log(
          `[Email Service - Brevo] [${ticketNumber}] Dispatched to ${to} (ID: ${providerMessageId})`,
        );
      }
      // 3. Fallback to standard Nodemailer SMTP
      else {
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
        providerMessageId = info.messageId;

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
      }

      // Record successful delivery event
      await EmailEvent.create({
        providerMessageId: providerMessageId || messageId,
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

/**
 * Notifies all administrators when a new ticket is opened by a customer
 */
export const notifyAdminsTicketCreated = async (
  ticket: any,
  requesterName: string,
) => {
  try {
    const adminUsers = await User.find({ role: USER_ROLES.ADMIN }).select(
      "email name",
    );
    for (const admin of adminUsers) {
      if (admin.email && admin.email !== ticket.requesterEmail) {
        sendTicketEmail({
          to: admin.email,
          subject: `New Ticket: ${ticket.subject}`,
          html: renderAdminNewTicketAlert(
            ticket.ticketNumber,
            ticket.subject,
            requesterName,
            ticket.requesterEmail,
            ticket.priority,
            ticket.description,
          ),
          ticketNumber: ticket.ticketNumber,
          ticketId: ticket._id,
        });
      }
    }
  } catch (err: any) {
    console.error(
      "[Email Service] Failed to notify admins of new ticket:",
      err.message,
    );
  }
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

export const notifyTicketAssigned = (
  ticket: any,
  assigneeEmail: string,
  assigneeName: string,
  assignerName: string,
) => {
  sendTicketEmail({
    to: assigneeEmail,
    subject: `You have been assigned to [${ticket.ticketNumber}] ${ticket.subject}`,
    html: renderTicketAssignedEmail(
      ticket.ticketNumber,
      ticket.subject,
      assigneeName,
      assignerName,
      ticket.priority,
      ticket.description,
    ),
    ticketNumber: ticket.ticketNumber,
    ticketId: ticket._id,
  });
};

/**
 * Sends a one-time password (OTP) email for Registration, Passwordless Login, or Password Reset
 */
export const sendOtpEmail = (
  email: string,
  name: string,
  otp: string,
  purpose: string = "Verification",
) => {
  if (email.endsWith("@bitdesk.dev") || email.endsWith("@bitdesk.local")) {
    return;
  }

  const subject = `Your BitDesk Verification Code: ${otp}`;
  const html = renderOtpEmail(name, otp, purpose);

  setImmediate(async () => {
    try {
      const resend = getResendClient();

      // 1. Check if Google Apps Script Gmail Relay is configured
      if (appConfig.GMAIL_RELAY_URL) {
        const relayRes = await fetch(appConfig.GMAIL_RELAY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject,
            html,
            senderName: "BitDesk Security",
          }),
        });

        const relayJson: any = await relayRes.json().catch(() => null);
        if (relayJson && relayJson.error) {
          throw new Error(`Gmail Relay OTP Error: ${relayJson.error}`);
        }
        console.log(
          `[Email Service - Gmail Relay OTP] Dispatched ${purpose} OTP to ${email}`,
        );
      }
      // 2. Check if Resend HTTP API is configured
      else if (resend) {
        let fromSender = "BitDesk Security <onboarding@resend.dev>";
        if (
          appConfig.EMAIL_FROM &&
          !appConfig.EMAIL_FROM.includes("@gmail.com") &&
          !appConfig.EMAIL_FROM.includes("@yahoo.") &&
          !appConfig.EMAIL_FROM.includes("@hotmail.") &&
          !appConfig.EMAIL_FROM.includes("@outlook.") &&
          !appConfig.EMAIL_FROM.includes("@bitdesk.local")
        ) {
          fromSender = appConfig.EMAIL_FROM;
        }

        const { error } = await resend.emails.send({
          from: fromSender,
          to: [email],
          subject,
          html,
        });

        if (error) {
          console.error(`[Email Service - Resend OTP Error]:`, error.message);
        } else {
          console.log(`[Email Service - Resend OTP] Dispatched ${purpose} OTP to ${email}`);
        }
      } else if (appConfig.BREVO_API_KEY) {
        const fromEmailMatch = (appConfig.EMAIL_FROM || "").match(/<([^>]+)>/) || [
          null,
          (appConfig.EMAIL_FROM || "").trim(),
        ];
        const fromEmail = fromEmailMatch[1] || appConfig.SMTP_USER || "security@bitdesk.local";

        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": appConfig.BREVO_API_KEY.trim(),
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            sender: { name: "BitDesk Security", email: fromEmail },
            to: [{ email }],
            subject,
            htmlContent: html,
          }),
        });
        console.log(`[Email Service - Brevo OTP] Dispatched ${purpose} OTP to ${email}`);
      } else {
        const activeTransporter = await getTransporter();
        const mailOptions = {
          from: appConfig.EMAIL_FROM || '"BitDesk Security" <security@bitdesk.local>',
          to: email,
          subject,
          html,
        };
        const info = await activeTransporter.sendMail(mailOptions);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`[OTP EMAIL PREVIEW URL]: ${previewUrl}`);
        } else {
          console.log(`[Email Service - SMTP OTP] Dispatched ${purpose} OTP to ${email}`);
        }
      }
    } catch (err: any) {
      console.error(
        `[Email Service] Failed to send OTP email to ${email}:`,
        err.message,
      );
    }
  });
};
