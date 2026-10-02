// server/src/modules/dashboard/dashboard.controller.ts
import type { Request, Response } from "express";
import Ticket from "../ticket/ticket.model.js";
import TicketActivity from "../ticketActivity/ticketActivity.model.js";
import { sendResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { TICKET_STATUS } from "../../constants/ticket.js";
import { USER_ROLES } from "../../constants/roles.js";

/**
 * Get Dashboard Summary Statistics
 * GET /api/dashboard/summary
 */
export const getDashboardSummary = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user!;

    // Base query: Customers only see their own metrics
    const baseQuery: any = {};
    if (user.role === USER_ROLES.CUSTOMER) {
      baseQuery.requesterId = user._id;
    }

    const [
      total,
      open,
      inProgress,
      pending,
      resolved,
      closed,
      reopened,
      unassigned,
      assignedToMe,
      recentActivity,
    ] = await Promise.all([
      Ticket.countDocuments(baseQuery),
      Ticket.countDocuments({ ...baseQuery, status: TICKET_STATUS.OPEN }),
      Ticket.countDocuments({
        ...baseQuery,
        status: TICKET_STATUS.IN_PROGRESS,
      }),
      Ticket.countDocuments({ ...baseQuery, status: TICKET_STATUS.PENDING }),
      Ticket.countDocuments({ ...baseQuery, status: TICKET_STATUS.RESOLVED }),
      Ticket.countDocuments({ ...baseQuery, status: TICKET_STATUS.CLOSED }),
      Ticket.countDocuments({ ...baseQuery, status: TICKET_STATUS.REOPENED }),
      Ticket.countDocuments({ ...baseQuery, assignedTo: null }),
      user.role !== USER_ROLES.CUSTOMER
        ? Ticket.countDocuments({ assignedTo: user._id })
        : 0,
      TicketActivity.find(
        user.role === USER_ROLES.CUSTOMER ? { actorId: user._id } : {},
      )
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("ticketId", "ticketNumber subject status")
        .populate("actorId", "name email role"),
    ]);

    return sendResponse(res, 200, "Dashboard summary fetched successfully", {
      counts: {
        total,
        open,
        inProgress,
        pending,
        resolved,
        closed,
        reopened,
        unassigned,
        assignedToMe,
      },
      recentActivity,
    });
  },
);
