// server/src/modules/email/email.controller.ts
import type { Request, Response } from "express";
import Ticket from "../ticket/ticket.model.js";
import TicketMessage from "../ticketMessage/ticketMessage.model.js";
import TicketActivity from "../ticketActivity/ticketActivity.model.js";
import EmailEvent from "./emailEvent.model.js";
import User from "../user/userModel.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  TICKET_STATUS,
  MESSAGE_TYPE,
  MESSAGE_SOURCE,
} from "../../constants/ticket.js";
import { USER_ROLES } from "../../constants/roles.js";
import { notifyTicketReply } from "./emailService.js";
import { emitTicketMessage, emitTicketStatusChanged } from "../../socket.js";

/**
 * Strips quoted history from reply emails (e.g. "On Oct 1 ... wrote:" or lines starting with ">")
 */
const cleanEmailReplyBody = (rawText: string): string => {
  if (!rawText) return "";

  const lines = rawText.split("\n");
  const cleanLines: string[] = [];

  for (const line of lines) {
    // Stop parsing if common email quote headers appear
    if (
      line.trim().startsWith(">") ||
      /^on .* wrote:$/i.test(line.trim()) ||
      /^-----original message-----/i.test(line.trim()) ||
      /^from: .*/i.test(line.trim())
    ) {
      break;
    }
    cleanLines.push(line);
  }

  const result = cleanLines.join("\n").trim();
  return result || rawText.trim();
};

/**
 * Inbound Email Webhook
 * POST /api/email/inbound
 */
export const handleInboundEmail = asyncHandler(
  async (req: Request, res: Response) => {
    // Extract standard inbound email fields
    const {
      from,
      to,
      subject = "",
      text = "",
      html = "",
      messageId = `<inbound-${Date.now()}@mail.local>`,
      inReplyTo,
      references,
      headers = {},
    } = req.body;

    if (!from || (!text && !html)) {
      throw new ApiError(400, "Missing required email fields (from, body)");
    }

    // Extract sender email address from "Name <user@domain.com>" or "user@domain.com"
    const senderEmailMatch = from.match(/<([^>]+)>/) || [null, from.trim()];
    const senderEmail = (senderEmailMatch[1] || from).toLowerCase().trim();

    // 1. Avoid duplicate processing using Message-ID
    const existingEvent = await EmailEvent.findOne({
      messageId,
      direction: "inbound",
    });
    if (existingEvent) {
      return sendResponse(res, 200, "Email already processed (duplicate)");
    }

    // 2. Identify the Ticket Number:
    // Check in-reply-to headers, subject line, or "reply+TKT-XXXX@domain" in 'to' address
    let ticketNumberMatch =
      (inReplyTo && inReplyTo.match(/ticket-(TKT-\d{4}-\d{6})/i)) ||
      (references && references.match(/ticket-(TKT-\d{4}-\d{6})/i)) ||
      (to && to.match(/\+(TKT-\d{4}-\d{6})/i)) ||
      subject.match(/(TKT-\d{4}-\d{6})/i);

    if (!ticketNumberMatch || !ticketNumberMatch[1]) {
      // Record unlinked inbound email for debugging
      await EmailEvent.create({
        messageId,
        recipientEmail: to,
        direction: "inbound",
        subject,
        status: "failed",
        error: "Could not match email to any valid Ticket Number",
        processedAt: new Date(),
      });

      return sendResponse(
        res,
        200,
        "Email received but ignored: No matching ticket found in thread headers or subject.",
      );
    }

    const ticketNumber = ticketNumberMatch[1].toUpperCase();

    // 3. Find the Ticket in MongoDB
    const ticket = await Ticket.findOne({ ticketNumber });
    if (!ticket) {
      await EmailEvent.create({
        messageId,
        ticketNumber,
        direction: "inbound",
        subject,
        status: "failed",
        error: `Ticket ${ticketNumber} does not exist in database`,
        processedAt: new Date(),
      });
      return sendResponse(res, 200, `Ticket ${ticketNumber} not found.`);
    }

    // 4. Clean out quoted reply text
    const cleanBody = cleanEmailReplyBody(
      text || html.replace(/<[^>]*>?/gm, ""),
    );

    // Prevent loopback of system notification emails (e.g. assignment alerts, new ticket notices)
    if (
      subject.toLowerCase().includes("you have been assigned") ||
      subject.toLowerCase().includes("new ticket:") ||
      subject.toLowerCase().includes("verification code") ||
      cleanBody.includes("A support ticket has been assigned to you") ||
      cleanBody.includes("BitDesk Support Ticketing System")
    ) {
      console.log(
        `[Inbound Email] Ignored automated notification loopback for ${ticketNumber}`,
      );
      return sendResponse(
        res,
        200,
        "Ignored automated notification email loopback.",
      );
    }

    if (!cleanBody.trim()) {
      return sendResponse(
        res,
        200,
        "Email body was empty after stripping quoted text.",
      );
    }

    // 5. Look up sender user if registered, or default to customer role
    const senderUser = await User.findOne({ email: senderEmail });
    const senderRole = senderUser ? senderUser.role : USER_ROLES.CUSTOMER;

    // 6. Append new message to Ticket thread
    const ticketMessage = await TicketMessage.create({
      ticketId: ticket._id,
      senderId: senderUser ? senderUser._id : null,
      senderEmail,
      senderRole,
      type: MESSAGE_TYPE.PUBLIC,
      body: cleanBody,
      source: MESSAGE_SOURCE.EMAIL,
      emailMessageId: messageId,
    });

    ticket.lastMessageAt = new Date();

    emitTicketMessage(ticket._id.toString(), ticketMessage);

    // 7. Auto-Reopen if resolved/closed and email was sent by customer
    if (
      senderRole === USER_ROLES.CUSTOMER &&
      (ticket.status === TICKET_STATUS.RESOLVED ||
        ticket.status === TICKET_STATUS.CLOSED)
    ) {
      const oldStatus = ticket.status;
      ticket.status = TICKET_STATUS.REOPENED;

      await TicketActivity.create({
        ticketId: ticket._id,
        actorId: senderUser ? senderUser._id : null,
        actorEmail: senderEmail,
        action: "STATUS_CHANGED",
        oldValue: oldStatus,
        newValue: TICKET_STATUS.REOPENED,
        metadata: { reason: "Inbound email reply received on resolved ticket" },
      });

      emitTicketStatusChanged(ticket._id.toString(), {
        ticket,
        oldStatus,
        newStatus: TICKET_STATUS.REOPENED,
      });
    }

    await ticket.save();

    // 8. 2-Way Email Relay: Notify the other party of this email reply
    if (senderRole === USER_ROLES.CUSTOMER) {
      // Customer replied via email -> notify assigned agent (or admins if unassigned)
      if (ticket.assignedTo) {
        User.findById(ticket.assignedTo).then((agent) => {
          if (agent && agent.email && agent.email !== senderEmail) {
            notifyTicketReply(
              ticket,
              agent.email,
              senderUser?.name || "Customer",
              cleanBody,
            );
          }
        });
      } else {
        User.find({ role: USER_ROLES.ADMIN }).select("email").then((admins) => {
          for (const admin of admins) {
            if (admin.email && admin.email !== senderEmail) {
              notifyTicketReply(
                ticket,
                admin.email,
                `${senderUser?.name || "Customer"} (Customer Waiting)`,
                cleanBody,
              );
            }
          }
        });
      }
    } else {
      // Agent / Admin replied via email -> notify customer
      if (ticket.requesterEmail && ticket.requesterEmail !== senderEmail) {
        notifyTicketReply(
          ticket,
          ticket.requesterEmail,
          senderUser?.name || "Support Agent",
          cleanBody,
        );
      }
    }

    // Log activity
    await TicketActivity.create({
      ticketId: ticket._id,
      actorId: senderUser ? senderUser._id : null,
      actorEmail: senderEmail,
      action: "EMAIL_REPLY_RECEIVED",
      newValue: cleanBody.substring(0, 100),
      metadata: { messageId, source: "inbound_email" },
    });

    // Record successful email event
    await EmailEvent.create({
      messageId,
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      recipientEmail: to,
      direction: "inbound",
      subject,
      status: "processed",
      processedAt: new Date(),
    });

    return sendResponse(res, 201, "Email reply processed and added to ticket", {
      ticketNumber: ticket.ticketNumber,
      messageId: ticketMessage._id,
    });
  },
);
