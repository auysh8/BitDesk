// server/src/modules/ticket/ticket.controller.ts
import type { Request, Response } from "express";
import mongoose from "mongoose";
import Ticket from "./ticket.model.js";
import TicketMessage from "../ticketMessage/ticketMessage.model.js";
import TicketActivity from "../ticketActivity/ticketActivity.model.js";
import Category from "../category/category.model.js";
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
import {
  notifyTicketCreated,
  notifyAdminsTicketCreated,
  notifyTicketReply,
  notifyStatusChanged,
  notifyTicketAssigned,
} from "../email/emailService.js";
import {
  emitTicketMessage,
  emitTicketStatusChanged,
  emitTicketAssigned,
} from "../../socket.js";

/**
 * 1. Create a new Ticket
 * POST /api/tickets
 */
export const createTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const { subject, description, category, priority, attachments } = req.body;
    const user = req.user!;

    const validCategory = await Category.findById(category);
    if (!validCategory || !validCategory.isActive) {
      throw new ApiError(400, "Invalid or inactive category selected");
    }

    const ticket = await Ticket.create({
      subject,
      description,
      requesterId: user._id,
      requesterEmail: user.email,
      category: validCategory._id,
      priority: priority || undefined,
      attachments: attachments || [],
      status: TICKET_STATUS.OPEN,
      lastMessageAt: new Date(),
    });

    // Create initial message in conversation thread
    await TicketMessage.create({
      ticketId: ticket._id,
      senderId: user._id,
      senderEmail: user.email,
      senderRole: user.role,
      type: MESSAGE_TYPE.PUBLIC,
      body: description,
      attachments: attachments || [],
      source: MESSAGE_SOURCE.WEB,
    });

    // Log creation activity
    await TicketActivity.create({
      ticketId: ticket._id,
      actorId: user._id,
      actorEmail: user.email,
      action: "TICKET_CREATED",
      newValue: ticket.ticketNumber,
      metadata: { priority: ticket.priority, category: validCategory.name },
    });
    // Send outbound confirmation email (non-blocking)
    notifyTicketCreated(ticket, user.name);
    notifyAdminsTicketCreated(ticket, user.name);

    return sendResponse(res, 201, "Ticket created successfully", ticket);
  },
);

/**
 * 2. List Tickets with Search, Filters, Sorting, and Pagination
 * GET /api/tickets
 */
export const getTickets = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  const {
    page = 1,
    limit = 10,
    search,
    status,
    priority,
    category,
    assignedTo,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query: any = {};

  // Role-based visibility: Customers only see their own tickets
  if (user.role === USER_ROLES.CUSTOMER) {
    query.requesterId = user._id;
  } else if (assignedTo) {
    query.assignedTo = assignedTo === "unassigned" ? null : assignedTo;
  }

  // Filters
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;

  // Search by Ticket Number or Subject
  if (search) {
    query.$or = [
      { ticketNumber: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
    ];
  }

  const pageNumber = Math.max(1, Number(page));
  const pageSize = Math.max(1, Number(limit));
  const skip = (pageNumber - 1) * pageSize;

  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .populate("requesterId", "name email role")
      .populate("assignedTo", "name email role")
      .populate("category", "name")
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize),
    Ticket.countDocuments(query),
  ]);

  return sendResponse(res, 200, "Tickets fetched successfully", {
    tickets,
    pagination: {
      total,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
      limit: pageSize,
    },
  });
});

/**
 * 3. Get Single Ticket Details
 * GET /api/tickets/:ticketId
 */
export const getTicketById = asyncHandler(
  async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const user = req.user!;

    const ticket = await Ticket.findById(ticketId)
      .populate("requesterId", "name email role")
      .populate("assignedTo", "name email role")
      .populate("category", "name");

    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    // Authorization check
    if (
      user.role === USER_ROLES.CUSTOMER &&
      ticket.requesterId._id.toString() !== user._id.toString()
    ) {
      throw new ApiError(403, "You do not have permission to view this ticket");
    }

    return sendResponse(res, 200, "Ticket fetched successfully", ticket);
  },
);

/**
 * 4. Add Message / Reply to Ticket
 * POST /api/tickets/:ticketId/messages
 */
export const addTicketMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const { body, type, attachments } = req.body;
    const user = req.user!;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    // Role check: Customers can only reply to their own tickets
    if (
      user.role === USER_ROLES.CUSTOMER &&
      ticket.requesterId.toString() !== user._id.toString()
    ) {
      throw new ApiError(403, "You cannot reply to another user's ticket");
    }

    // Role check: Customers cannot create internal notes
    if (type === MESSAGE_TYPE.INTERNAL && user.role === USER_ROLES.CUSTOMER) {
      throw new ApiError(403, "Customers cannot create internal notes");
    }

    // Role check: If ticket is assigned to another agent, non-assigned agents can only post internal notes
    const isPublic = !type || type === MESSAGE_TYPE.PUBLIC;
    if (
      isPublic &&
      user.role === USER_ROLES.AGENT &&
      ticket.assignedTo &&
      ticket.assignedTo.toString() !== user._id.toString()
    ) {
      throw new ApiError(
        403,
        "This ticket is assigned to another agent. Only the assigned agent or an administrator can send public replies to the customer. You can still post an internal note.",
      );
    }

    const message = await TicketMessage.create({
      ticketId: ticket._id,
      senderId: user._id,
      senderEmail: user.email,
      senderRole: user.role,
      type: type || MESSAGE_TYPE.PUBLIC,
      body,
      attachments: attachments || [],
      source: MESSAGE_SOURCE.WEB,
    });

    ticket.lastMessageAt = new Date();

    emitTicketMessage(ticket._id.toString(), message);

    // Auto-reopen if ticket was resolved or closed and customer sends a public reply
    if (
      user.role === USER_ROLES.CUSTOMER &&
      (ticket.status === TICKET_STATUS.RESOLVED ||
        ticket.status === TICKET_STATUS.CLOSED)
    ) {
      const oldStatus = ticket.status;
      ticket.status = TICKET_STATUS.REOPENED;

      await TicketActivity.create({
        ticketId: ticket._id,
        actorId: user._id,
        actorEmail: user.email,
        action: "STATUS_CHANGED",
        oldValue: oldStatus,
        newValue: TICKET_STATUS.REOPENED,
        metadata: { reason: "Customer replied to resolved/closed ticket" },
      });

      emitTicketStatusChanged(ticket._id.toString(), {
        ticket,
        oldStatus,
        newStatus: TICKET_STATUS.REOPENED,
      });
    }

    // Send outbound email if it's a public reply
    if (message.type === MESSAGE_TYPE.PUBLIC) {
      if (user.role === USER_ROLES.CUSTOMER) {
        // If customer replied and ticket has an assigned agent, notify agent
        if (ticket.assignedTo) {
          User.findById(ticket.assignedTo).then((agent) => {
            if (agent)
              notifyTicketReply(ticket, agent.email, user.name, body);
          });
        } else {
          // If ticket is unassigned, alert administrators so the customer is not left hanging
          User.find({ role: USER_ROLES.ADMIN }).select("email").then((admins) => {
            for (const admin of admins) {
              if (admin.email && admin.email !== user.email) {
                notifyTicketReply(ticket, admin.email, `${user.name} (Customer Waiting)`, body);
              }
            }
          });
        }
      } else {
        // If agent replied, notify requester
        notifyTicketReply(ticket, ticket.requesterEmail, user.name, body);
      }
    }

    await ticket.save();

    await TicketActivity.create({
      ticketId: ticket._id,
      actorId: user._id,
      actorEmail: user.email,
      action:
        type === MESSAGE_TYPE.INTERNAL ? "INTERNAL_NOTE_ADDED" : "REPLY_ADDED",
      newValue: body.substring(0, 100),
    });

    return sendResponse(res, 201, "Message added successfully", message);
  },
);

/**
 * 5. Get Ticket Conversation Messages
 * GET /api/tickets/:ticketId/messages
 */
export const getTicketMessages = asyncHandler(
  async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const user = req.user!;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    if (
      user.role === USER_ROLES.CUSTOMER &&
      ticket.requesterId.toString() !== user._id.toString()
    ) {
      throw new ApiError(
        403,
        "You do not have permission to view these messages",
      );
    }

    // Customers only see public messages; Agents/Admins see both public and internal notes
    const messageQuery: any = { ticketId: ticket._id };
    if (user.role === USER_ROLES.CUSTOMER) {
      messageQuery.type = MESSAGE_TYPE.PUBLIC;
    }

    const messages = await TicketMessage.find(messageQuery)
      .populate("senderId", "name email role")
      .sort({ createdAt: 1 });

    return sendResponse(res, 200, "Messages fetched successfully", messages);
  },
);

/**
 * 6. Assign / Reassign Ticket (Agent & Admin only)
 * POST /api/tickets/:ticketId/assign
 */
export const assignTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const { agentId } = req.body;
    const actor = req.user!;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    const agent = await User.findById(agentId);
    if (
      !agent ||
      (agent.role !== USER_ROLES.AGENT && agent.role !== USER_ROLES.ADMIN)
    ) {
      throw new ApiError(400, "Assigned user must have an Agent or Admin role");
    }

    // Hybrid Rule: Agents can only claim tickets for themselves and cannot reassign tickets already owned by others
    if (actor.role === USER_ROLES.AGENT) {
      if (agentId !== actor._id.toString()) {
        throw new ApiError(
          403,
          "Support agents can only claim tickets for themselves. Only an administrator can reassign tickets to other staff members."
        );
      }
      if (
        ticket.assignedTo &&
        ticket.assignedTo.toString() !== actor._id.toString()
      ) {
        throw new ApiError(
          403,
          "This ticket is already assigned to another staff member. Only an administrator can reassign it."
        );
      }
    }

    const oldAssignee = ticket.assignedTo
      ? ticket.assignedTo.toString()
      : "Unassigned";
    ticket.assignedTo = agent._id as mongoose.Types.ObjectId;
    ticket.assignedAt = new Date();

    // If status is OPEN, move to IN_PROGRESS upon assignment
    if (ticket.status === TICKET_STATUS.OPEN) {
      ticket.status = TICKET_STATUS.IN_PROGRESS;
    }

    await ticket.save();

    // Notify the assigned staff member via email
    notifyTicketAssigned(ticket, agent.email, agent.name, actor.name);

    await TicketActivity.create({
      ticketId: ticket._id,
      actorId: actor._id,
      actorEmail: actor.email,
      action: "TICKET_ASSIGNED",
      oldValue: oldAssignee,
      newValue: agent.name,
      metadata: { agentId: agent._id, agentEmail: agent.email },
    });

    emitTicketAssigned(ticket._id.toString(), { ticket, agent });

    return sendResponse(res, 200, `Ticket assigned to ${agent.name}`, ticket);
  },
);

/**
 * 7. Resolve Ticket (Agent & Admin)
 * POST /api/tickets/:ticketId/resolve
 */
export const resolveTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const actor = req.user!;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    const oldStatus = ticket.status;
    ticket.status = TICKET_STATUS.RESOLVED;
    ticket.resolvedAt = new Date();
    await ticket.save();

    notifyStatusChanged(
      ticket,
      ticket.requesterEmail,
      oldStatus,
      TICKET_STATUS.RESOLVED,
    );

    await TicketActivity.create({
      ticketId: ticket._id,
      actorId: actor._id,
      actorEmail: actor.email,
      action: "STATUS_CHANGED",
      oldValue: oldStatus,
      newValue: TICKET_STATUS.RESOLVED,
    });

    emitTicketStatusChanged(ticket._id.toString(), {
      ticket,
      oldStatus,
      newStatus: TICKET_STATUS.RESOLVED,
    });

    return sendResponse(res, 200, "Ticket marked as resolved", ticket);
  },
);

/**
 * 8. Reopen Ticket (Customer, Agent & Admin)
 * POST /api/tickets/:ticketId/reopen
 */
export const reopenTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const actor = req.user!;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    if (
      actor.role === USER_ROLES.CUSTOMER &&
      ticket.requesterId.toString() !== actor._id.toString()
    ) {
      throw new ApiError(403, "You cannot reopen another user's ticket");
    }

    const oldStatus = ticket.status;
    ticket.status = TICKET_STATUS.REOPENED;
    ticket.resolvedAt = null;
    ticket.closedAt = null;
    await ticket.save();

    notifyStatusChanged(
      ticket,
      ticket.requesterEmail,
      oldStatus,
      TICKET_STATUS.REOPENED,
    );

    await TicketActivity.create({
      ticketId: ticket._id,
      actorId: actor._id,
      actorEmail: actor.email,
      action: "STATUS_CHANGED",
      oldValue: oldStatus,
      newValue: TICKET_STATUS.REOPENED,
    });

    emitTicketStatusChanged(ticket._id.toString(), {
      ticket,
      oldStatus,
      newStatus: TICKET_STATUS.REOPENED,
    });

    return sendResponse(res, 200, "Ticket reopened successfully", ticket);
  },
);

/**
 * 9. Close Ticket
 * POST /api/tickets/:ticketId/close
 */
export const closeTicket = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const actor = req.user!;

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  if (
    actor.role === USER_ROLES.CUSTOMER &&
    ticket.requesterId.toString() !== actor._id.toString()
  ) {
    throw new ApiError(403, "You cannot close another user's ticket");
  }

  const oldStatus = ticket.status;
  ticket.status = TICKET_STATUS.CLOSED;
  ticket.closedAt = new Date();
  await ticket.save();

  notifyStatusChanged(
    ticket,
    ticket.requesterEmail,
    oldStatus,
    TICKET_STATUS.CLOSED,
  );

  await TicketActivity.create({
    ticketId: ticket._id,
    actorId: actor._id,
    actorEmail: actor.email,
    action: "STATUS_CHANGED",
    oldValue: oldStatus,
    newValue: TICKET_STATUS.CLOSED,
  });

  emitTicketStatusChanged(ticket._id.toString(), {
    ticket,
    oldStatus,
    newStatus: TICKET_STATUS.CLOSED,
  });

  return sendResponse(res, 200, "Ticket closed successfully", ticket);
});

/**
 * 10. Get Ticket Activity Timeline
 * GET /api/tickets/:ticketId/activity
 */
export const getTicketActivity = asyncHandler(
  async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const user = req.user!;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    if (
      user.role === USER_ROLES.CUSTOMER &&
      ticket.requesterId.toString() !== user._id.toString()
    ) {
      throw new ApiError(
        403,
        "You do not have permission to view this activity",
      );
    }

    const activities = await TicketActivity.find({ ticketId: ticket._id })
      .populate("actorId", "name email role")
      .sort({ createdAt: 1 });

    return sendResponse(res, 200, "Ticket activity fetched", activities);
  },
);

/**
 * Update Ticket Metadata (Status, Priority, Category)
 * PATCH /api/tickets/:ticketId
 */
export const updateTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const { priority, category, status } = req.body;
    const user = req.user!;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    // Customers cannot modify priority/category/status via PATCH
    if (user.role === USER_ROLES.CUSTOMER) {
      throw new ApiError(
        403,
        "Only support staff or admins can update ticket details",
      );
    }

    if (category) {
      const validCategory = await Category.findById(category);
      if (!validCategory) throw new ApiError(400, "Invalid category ID");
      ticket.category = validCategory._id as any;
    }

    if (priority && priority !== ticket.priority) {
      const oldPriority = ticket.priority;
      ticket.priority = priority;

      await TicketActivity.create({
        ticketId: ticket._id,
        actorId: user._id,
        actorEmail: user.email,
        action: "PRIORITY_CHANGED",
        oldValue: oldPriority,
        newValue: priority,
      });
    }

    if (status && status !== ticket.status) {
      const oldStatus = ticket.status;
      ticket.status = status;

      if (status === TICKET_STATUS.RESOLVED) {
        ticket.resolvedAt = new Date();
      } else if (status === TICKET_STATUS.CLOSED) {
        ticket.closedAt = new Date();
      } else if (status === TICKET_STATUS.REOPENED) {
        ticket.resolvedAt = null;
        ticket.closedAt = null;
      }

      await TicketActivity.create({
        ticketId: ticket._id,
        actorId: user._id,
        actorEmail: user.email,
        action: "STATUS_CHANGED",
        oldValue: oldStatus,
        newValue: status,
      });

      notifyStatusChanged(ticket, ticket.requesterEmail, oldStatus, status);

      emitTicketStatusChanged(ticket._id.toString(), {
        ticket,
        oldStatus,
        newStatus: status,
      });
    }

    await ticket.save();

    return sendResponse(res, 200, "Ticket updated successfully", ticket);
  },
);
