// server/src/templates/email/emailTemplates.ts

const baseLayout = (content: string, ticketNumber: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 20px; color: #172b4d; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { background: #0052cc; color: #ffffff; padding: 20px 24px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 600; }
    .header .ticket-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-size: 13px; margin-top: 6px; }
    .content { padding: 24px; line-height: 1.6; }
    .footer { background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    .reply-notice { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #0369a1; }
    .quote-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; margin: 16px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BitDesk Support</h1>
      <div class="ticket-badge">Ticket ${ticketNumber}</div>
    </div>
    <div class="content">
      ${content}
      <div class="reply-notice">
        <strong>💡 Direct Email Reply Enabled:</strong> You can reply directly to this email from your inbox to send a response to our support team.
      </div>
    </div>
    <div class="footer">
      BitDesk Support Ticketing System • Ticket Ref: ${ticketNumber}
    </div>
  </div>
</body>
</html>
`;

export const renderTicketCreatedEmail = (
  ticketNumber: string,
  subject: string,
  requesterName: string,
  description: string,
) => {
  const content = `
    <p>Hi <strong>${requesterName}</strong>,</p>
    <p>Thank you for reaching out to us. We have received your support request and our team is already reviewing it.</p>
    <div class="quote-box">
      <strong>Subject:</strong> ${subject}<br><br>
      <strong>Description:</strong><br>
      ${description.replace(/\n/g, "<br>")}
    </div>
    <p>We will keep you updated as soon as there is progress on your request.</p>
  `;
  return baseLayout(content, ticketNumber);
};

export const renderAdminNewTicketAlert = (
  ticketNumber: string,
  subject: string,
  requesterName: string,
  requesterEmail: string,
  priority: string,
  description: string,
) => {
  const content = `
    <p>🔔 A new support ticket has been submitted by <strong>${requesterName}</strong> (${requesterEmail}).</p>
    <div class="quote-box">
      <strong>Ticket Number:</strong> ${ticketNumber}<br>
      <strong>Priority:</strong> ${(priority || "MEDIUM").toUpperCase()}<br>
      <strong>Subject:</strong> ${subject}<br><br>
      <strong>Description:</strong><br>
      ${description.replace(/\n/g, "<br>")}
    </div>
    <p>Please log in to BitDesk to claim or assign this ticket.</p>
  `;
  return baseLayout(content, ticketNumber);
};

export const renderTicketReplyEmail = (
  ticketNumber: string,
  subject: string,
  senderName: string,
  replyBody: string,
) => {
  const content = `
    <p>Hi,</p>
    <p><strong>${senderName}</strong> added a new reply to your ticket <strong>[${ticketNumber}] ${subject}</strong>:</p>
    <div class="quote-box">
      ${replyBody.replace(/\n/g, "<br>")}
    </div>
  `;
  return baseLayout(content, ticketNumber);
};

export const renderStatusChangedEmail = (
  ticketNumber: string,
  subject: string,
  oldStatus: string,
  newStatus: string,
) => {
  const content = `
    <p>Hello,</p>
    <p>The status of your support ticket <strong>[${ticketNumber}] ${subject}</strong> has been updated:</p>
    <div class="quote-box">
      <strong>Previous Status:</strong> ${oldStatus.toUpperCase()}<br>
      <strong>New Status:</strong> <span style="color: #0284c7; font-weight: bold;">${newStatus.toUpperCase()}</span>
    </div>
    <p>If you have any further questions or if your issue is not resolved, simply reply to this email to reopen the conversation.</p>
  `;
  return baseLayout(content, ticketNumber);
};

export const renderTicketAssignedEmail = (
  ticketNumber: string,
  subject: string,
  assigneeName: string,
  assignerName: string,
  priority: string,
  description: string,
) => {
  const content = `
    <p>Hi <strong>${assigneeName}</strong>,</p>
    <p>A support ticket has been assigned to you by <strong>${assignerName}</strong>.</p>
    <div class="quote-box">
      <strong>Ticket:</strong> [${ticketNumber}] ${subject}<br>
      <strong>Priority:</strong> <span style="text-transform: uppercase; font-weight: bold; color: #0284c7;">${priority}</span><br><br>
      <strong>Description:</strong><br>
      ${(description || "").replace(/\n/g, "<br>")}
    </div>
    <p>Please review the ticket in your BitDesk dashboard to begin resolving it.</p>
  `;
  return baseLayout(content, ticketNumber);
};
